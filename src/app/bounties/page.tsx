"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

interface BountyProblem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  bountyAmount: number;
  bountyStatus: string;
  sponsorName: string;
  createdAt: string;
  creator: { name: string };
  project: { id: string; status: string } | null;
  bountySubmissions: { id: string; status: string; submitter: { name: string } }[];
}

function getCategoryColor(cat: string) {
  const colors: Record<string, string> = {
    health: "bg-rose-100 text-rose-700",
    education: "bg-blue-100 text-blue-700",
    environment: "bg-emerald-100 text-emerald-700",
    agriculture: "bg-lime-100 text-lime-700",
    employment: "bg-amber-100 text-amber-700",
  };
  return colors[cat] || "bg-gray-100 text-gray-700";
}

function getBountyStatusStyle(status: string) {
  if (status === "open") return "bg-green-100 text-green-700";
  if (status === "awarded") return "bg-purple-100 text-purple-700";
  return "bg-gray-100 text-gray-700";
}

export default function BountiesPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [bounties, setBounties] = useState<BountyProblem[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "general", bountyAmount: "", sponsorName: "" });
  const [submitForm, setSubmitForm] = useState<{ problemId: string; content: string } | null>(null);

  useEffect(() => {
    loadBounties();
  }, []);

  function loadBounties() {
    fetch("/api/bounties").then((r) => r.json()).then(setBounties).catch(() => {});
  }

  async function createBounty(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/bounties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", description: "", category: "general", bountyAmount: "", sponsorName: "" });
    setShowCreate(false);
    loadBounties();
  }

  async function submitSolution(e: React.FormEvent) {
    e.preventDefault();
    if (!submitForm) return;
    await fetch(`/api/bounties/${submitForm.problemId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit", content: submitForm.content }),
    });
    setSubmitForm(null);
    loadBounties();
  }

  const totalBountyPool = bounties.filter((b) => b.bountyStatus === "open").reduce((sum, b) => sum + b.bountyAmount, 0);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            {t.bounties.title}
          </h1>
          <p className="mt-4 text-lg text-amber-100 max-w-2xl mx-auto">
            {t.bounties.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold">${totalBountyPool.toLocaleString()}</div>
              <div className="text-amber-200 text-sm mt-1">{t.bounties.totalPool}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{bounties.filter((b) => b.bountyStatus === "open").length}</div>
              <div className="text-amber-200 text-sm mt-1">{t.bounties.activeBounties}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{bounties.filter((b) => b.bountyStatus === "awarded").length}</div>
              <div className="text-amber-200 text-sm mt-1">Awarded</div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10 w-full">
        {/* Actions */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-gray-900">{t.bounties.activeBounties}</h2>
          {session && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition"
            >
              {t.bounties.createBounty}
            </button>
          )}
        </div>

        {/* Create form */}
        {showCreate && (
          <form onSubmit={createBounty} className="bg-white rounded-xl border border-gray-200 p-6 mb-8 space-y-4">
            <h3 className="font-semibold text-gray-900">{t.bounties.createBounty}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t.bounties.problemTitle}</label>
                <input type="text" required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t.bounties.sponsorName}</label>
                <input type="text" value={form.sponsorName} onChange={(e) => setForm((p) => ({ ...p, sponsorName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Your org name (optional)" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t.bounties.problemDescription}</label>
              <textarea required rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t.problems.category}</label>
                <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                  <option value="health">Health</option>
                  <option value="education">Education</option>
                  <option value="environment">Environment</option>
                  <option value="agriculture">Agriculture</option>
                  <option value="employment">Employment</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t.bounties.bountyAmount}</label>
                <input type="number" required min="1" value={form.bountyAmount} onChange={(e) => setForm((p) => ({ ...p, bountyAmount: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="e.g. 5000" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-amber-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-amber-700">{t.bounties.createBounty}</button>
              <button type="button" onClick={() => setShowCreate(false)} className="text-sm text-gray-500 px-4 py-2">{t.common.cancel}</button>
            </div>
          </form>
        )}

        {/* Bounty cards */}
        <div className="space-y-6">
          {bounties.map((bounty) => (
            <div key={bounty.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${getCategoryColor(bounty.category)}`}>
                        {bounty.category}
                      </span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${getBountyStatusStyle(bounty.bountyStatus)}`}>
                        {bounty.bountyStatus}
                      </span>
                      {bounty.sponsorName && (
                        <span className="text-xs text-gray-500">{t.bounties.sponsored} {bounty.sponsorName}</span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{bounty.title}</h3>
                    <p className="text-sm text-gray-600 mt-2">{bounty.description}</p>

                    {/* Submissions */}
                    {bounty.bountySubmissions.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">
                          {bounty.bountySubmissions.length} submission{bounty.bountySubmissions.length !== 1 ? "s" : ""}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {bounty.bountySubmissions.map((sub) => (
                            <span key={sub.id} className={`text-xs px-2 py-1 rounded-full ${
                              sub.status === "accepted" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                            }`}>
                              {sub.submitter.name} — {sub.status}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bounty amount */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-600">${bounty.bountyAmount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">bounty</div>
                    {bounty.bountyStatus === "open" && session && (
                      <button
                        onClick={() => setSubmitForm({ problemId: bounty.id, content: "" })}
                        className="mt-3 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition"
                      >
                        {t.bounties.submitSolution}
                      </button>
                    )}
                  </div>
                </div>

                {/* Submit solution form */}
                {submitForm?.problemId === bounty.id && (
                  <form onSubmit={submitSolution} className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                    <label className="block text-sm font-medium text-amber-900">{t.bounties.yourSolution}</label>
                    <textarea
                      required rows={4}
                      value={submitForm.content}
                      onChange={(e) => setSubmitForm({ ...submitForm, content: e.target.value })}
                      className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700">{t.common.submit}</button>
                      <button type="button" onClick={() => setSubmitForm(null)} className="text-sm text-gray-500 px-4 py-2">{t.common.cancel}</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ))}

          {bounties.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500">No bounties yet. Be the first to post one!</p>
            </div>
          )}
        </div>

        {/* How bounties work */}
        <div className="mt-16 bg-gray-50 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">{t.bounties.howItWorks}</h3>
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto">1</div>
              <p className="text-sm text-gray-600 mt-3">{t.bounties.step1}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto">2</div>
              <p className="text-sm text-gray-600 mt-3">{t.bounties.step2}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto">3</div>
              <p className="text-sm text-gray-600 mt-3">{t.bounties.step3}</p>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">{t.bounties.platformFee}</p>
        </div>
      </div>
    </div>
  );
}
