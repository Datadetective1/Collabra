"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/context";

interface Org {
  id: string;
  name: string;
  slug: string;
  description: string;
  tier: string;
  website: string;
  createdAt: string;
  members: { user: { id: string; name: string; points: number }; role: string }[];
  problems: { id: string; title: string; bountyAmount: number; bountyStatus: string; status: string }[];
}

const tierInfo: Record<string, { label: string; color: string; price: string; features: string[] }> = {
  free: {
    label: "Free",
    color: "bg-gray-100 text-gray-700",
    price: "$0/mo",
    features: ["Up to 3 members", "Public projects only", "Community support"],
  },
  team: {
    label: "Team",
    color: "bg-blue-100 text-blue-700",
    price: "$25/mo",
    features: ["Up to 15 members", "Private projects", "Post bounties", "Team analytics", "Priority support"],
  },
  enterprise: {
    label: "Enterprise",
    color: "bg-purple-100 text-purple-700",
    price: "$99/mo",
    features: ["Unlimited members", "Private projects", "Post bounties", "Advanced analytics", "Custom branding", "Dedicated support", "API access"],
  },
};

export default function OrganizationsPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id;
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", website: "" });

  useEffect(() => {
    fetch("/api/organizations").then((r) => r.json()).then(setOrgs).catch(() => {});
  }, []);

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ name: "", description: "", website: "" });
      setShowCreate(false);
      const data = await fetch("/api/organizations").then((r) => r.json());
      setOrgs(data);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            {t.orgs.title}
          </h1>
          <p className="mt-4 text-lg text-blue-200 max-w-2xl mx-auto">
            {t.orgs.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {session && (
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="bg-white text-blue-700 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition"
              >
                {t.orgs.createOrg}
              </button>
            )}
            <button
              onClick={() => setShowPricing(!showPricing)}
              className="border border-white/30 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              {t.orgs.viewPricing}
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10 w-full">
        {/* Create form */}
        {showCreate && (
          <form onSubmit={createOrg} className="bg-white rounded-xl border border-gray-200 p-6 mb-8 space-y-4">
            <h3 className="font-semibold text-gray-900">{t.orgs.createOrg}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t.orgs.orgName}</label>
                <input type="text" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t.orgs.website}</label>
                <input type="url" value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://..." />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t.orgs.description}</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder={t.orgs.descriptionPlaceholder} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">{t.common.create}</button>
              <button type="button" onClick={() => setShowCreate(false)} className="text-sm text-gray-500 px-4 py-2">{t.common.cancel}</button>
            </div>
          </form>
        )}

        {/* Pricing */}
        {showPricing && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">{t.orgs.pricingPlans}</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {Object.entries(tierInfo).map(([key, tier]) => (
                <div key={key} className={`bg-white rounded-xl border-2 p-6 ${key === "team" ? "border-blue-500 shadow-lg" : "border-gray-200"}`}>
                  {key === "team" && (
                    <span className="inline-block bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full mb-3">{t.orgs.mostPopular}</span>
                  )}
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tier.color}`}>{tier.label}</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-3">{tier.price}</div>
                  <ul className="mt-6 space-y-3">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button className={`mt-6 w-full py-2.5 rounded-lg text-sm font-medium transition ${
                    key === "team"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : key === "enterprise"
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}>
                    {key === "free" ? t.orgs.currentPlan : t.orgs.upgrade}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Org list */}
        <h2 className="text-xl font-bold text-gray-900 mb-6">{t.orgs.title}</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {orgs.map((org) => {
            const tier = tierInfo[org.tier] || tierInfo.free;
            const totalBounties = org.problems.reduce((s, p) => s + p.bountyAmount, 0);
            const isMember = org.members.some((m) => m.user.id === userId);

            return (
              <div key={org.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{org.name}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tier.color}`}>{tier.label}</span>
                    </div>
                    {org.description && <p className="text-sm text-gray-600 mt-1">{org.description}</p>}
                  </div>
                  {isMember && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{t.orgs.member}</span>
                  )}
                </div>

                {org.website && (
                  <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
                    {org.website}
                  </a>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm font-bold text-gray-900">{org.members.length}</div>
                    <div className="text-xs text-gray-500">{t.orgs.members}</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{org.problems.length}</div>
                    <div className="text-xs text-gray-500">{t.orgs.problems}</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-amber-600">${totalBounties.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{t.orgs.bounties}</div>
                  </div>
                </div>

                {/* Members */}
                <div className="mt-4 flex -space-x-2">
                  {org.members.slice(0, 5).map((m, i) => (
                    <div key={i} className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 border-2 border-white"
                      title={m.user.name}>
                      {m.user.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {org.members.length > 5 && (
                    <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs text-gray-500 border-2 border-white">
                      +{org.members.length - 5}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {orgs.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500">{t.orgs.noOrgs}</p>
          </div>
        )}
      </div>
    </div>
  );
}
