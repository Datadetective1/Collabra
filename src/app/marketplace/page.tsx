"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

interface Listing {
  id: string;
  priceMonthly: number;
  tagline: string;
  features: string;
  totalRevenue: number;
  builderSplit: number;
  platformSplit: number;
  creatorSplit: number;
  project: {
    id: string;
    name: string;
    description: string;
    demoUrl: string;
    problem: { title: string; description: string; category: string; creator: { id: string; name: string } };
    teamMembers: { user: { id: string; name: string; points: number } }[];
    tasks: { id: string }[];
    milestones: { id: string }[];
  };
  licenses: { id: string; orgName: string; status: string }[];
}

function getCategoryColor(cat: string) {
  const colors: Record<string, string> = {
    health: "bg-rose-100 text-rose-700", education: "bg-blue-100 text-blue-700",
    environment: "bg-emerald-100 text-emerald-700", agriculture: "bg-lime-100 text-lime-700",
    employment: "bg-amber-100 text-amber-700",
  };
  return colors[cat] || "bg-gray-100 text-gray-700";
}

export default function MarketplacePage() {
  const { t } = useTranslation();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestForm, setRequestForm] = useState<{ listingId: string; name: string; email: string; orgName: string } | null>(null);
  const [requestStatus, setRequestStatus] = useState<"idle" | "loading" | "success">("idle");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetch("/api/marketplace")
      .then((r) => r.json())
      .then((data) => { setListings(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function requestLicense(e: React.FormEvent) {
    e.preventDefault();
    if (!requestForm) return;
    setRequestStatus("loading");

    const res = await fetch(`/api/marketplace/${requestForm.listingId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: requestForm.name, email: requestForm.email, orgName: requestForm.orgName }),
    });
    const data = await res.json();
    setRequestStatus("success");
    setSuccessMsg(data.message);
  }

  const totalRevenue = listings.reduce((s, l) => s + l.totalRevenue, 0);
  const totalLicensees = listings.reduce((s, l) => s + l.licenses.length, 0);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            {t.marketplace.title}
          </h1>
          <p className="mt-4 text-lg text-emerald-100 max-w-2xl mx-auto">
            {t.marketplace.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-10">
            <div className="text-center">
              <div className="text-3xl font-bold">{listings.length}</div>
              <div className="text-emerald-200 text-sm mt-1">Solutions Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{totalLicensees}</div>
              <div className="text-emerald-200 text-sm mt-1">Active Licensees</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">${totalRevenue.toLocaleString()}</div>
              <div className="text-emerald-200 text-sm mt-1">Revenue Generated</div>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue model explainer */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex flex-wrap justify-center items-center gap-6 text-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm">70%</div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">{t.marketplace.buildOnceBuilders}</p>
                <p className="text-xs text-gray-500">Engineers who built it</p>
              </div>
            </div>
            <div className="text-gray-300 text-lg">+</div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm">20%</div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">{t.marketplace.buildOncePlatform}</p>
                <p className="text-xs text-gray-500">Platform & infrastructure</p>
              </div>
            </div>
            <div className="text-gray-300 text-lg">+</div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-sm">10%</div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">{t.marketplace.buildOnceCreator}</p>
                <p className="text-xs text-gray-500">Who identified the need</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="max-w-6xl mx-auto px-4 py-12 w-full">
        {loading ? (
          <div className="text-center py-20 text-gray-500">{t.common.loading}</div>
        ) : (
          <div className="space-y-8">
            {listings.map((listing) => {
              const p = listing.project;
              const features = listing.features ? listing.features.split(",").map((f) => f.trim()).filter(Boolean) : [];
              const builderEarnings = Math.round(listing.totalRevenue * listing.builderSplit / 100);

              return (
                <div key={listing.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
                  <div className="p-8">
                    <div className="flex flex-wrap items-start justify-between gap-6">
                      {/* Left */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${getCategoryColor(p.problem.category)}`}>
                            {p.problem.category}
                          </span>
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                            {listing.licenses.length} licensee{listing.licenses.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">{p.problem.title}</h2>
                        <p className="text-gray-600 mt-1">{listing.tagline}</p>

                        {p.description && (
                          <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                            <p className="text-sm text-emerald-700">{p.description}</p>
                          </div>
                        )}

                        {/* Features */}
                        {features.length > 0 && (
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            {features.map((f) => (
                              <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {f}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Team */}
                        <div className="mt-5 flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {p.teamMembers.slice(0, 4).map((tm, i) => (
                              <div key={i} className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center text-xs font-medium text-emerald-700 border-2 border-white">
                                {tm.user.name.charAt(0).toUpperCase()}
                              </div>
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            Built by {p.teamMembers.map((tm) => tm.user.name).join(", ")}
                          </span>
                        </div>
                      </div>

                      {/* Right - pricing */}
                      <div className="w-64 flex-shrink-0">
                        <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200">
                          <div className="text-3xl font-bold text-gray-900">
                            ${listing.priceMonthly}
                            <span className="text-base font-normal text-gray-500">/mo</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">per organization</p>

                          <button
                            onClick={() => setRequestForm({ listingId: listing.id, name: "", email: "", orgName: "" })}
                            className="mt-4 w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
                          >
                            {t.marketplace.requestLicense}
                          </button>

                          <Link href={`/projects/${p.id}`}
                            className="mt-2 block text-xs text-gray-500 hover:text-gray-700 transition">
                            View project details
                          </Link>

                          {/* Revenue breakdown */}
                          {listing.totalRevenue > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200 text-left space-y-1.5">
                              <p className="text-xs font-medium text-gray-500 mb-2">Revenue generated</p>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-600">Total</span>
                                <span className="font-semibold text-gray-900">${listing.totalRevenue.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-emerald-600">Builders (70%)</span>
                                <span className="font-medium text-emerald-700">${builderEarnings.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-indigo-600">Collabra (20%)</span>
                                <span className="font-medium text-indigo-700">${Math.round(listing.totalRevenue * 0.2).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-amber-600">Creator (10%)</span>
                                <span className="font-medium text-amber-700">${Math.round(listing.totalRevenue * 0.1).toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* License request form */}
                    {requestForm?.listingId === listing.id && requestStatus !== "success" && (
                      <form onSubmit={requestLicense} className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-6 space-y-4">
                        <h3 className="font-semibold text-emerald-900">{t.marketplace.requestForm.title}</h3>
                        <div className="grid sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{t.marketplace.requestForm.yourName}</label>
                            <input type="text" required value={requestForm.name}
                              onChange={(e) => setRequestForm({ ...requestForm, name: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{t.marketplace.requestForm.yourEmail}</label>
                            <input type="email" required value={requestForm.email}
                              onChange={(e) => setRequestForm({ ...requestForm, email: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{t.marketplace.requestForm.orgName}</label>
                            <input type="text" value={requestForm.orgName}
                              onChange={(e) => setRequestForm({ ...requestForm, orgName: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                              placeholder="Optional" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" disabled={requestStatus === "loading"}
                            className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                            {requestStatus === "loading" ? t.marketplace.requestForm.requesting : t.marketplace.requestForm.request}
                          </button>
                          <button type="button" onClick={() => { setRequestForm(null); setRequestStatus("idle"); }}
                            className="text-sm text-gray-500 px-4 py-2">{t.common.cancel}</button>
                        </div>
                      </form>
                    )}

                    {requestForm?.listingId === listing.id && requestStatus === "success" && (
                      <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
                        <div className="text-2xl mb-2">&#10003;</div>
                        <p className="font-semibold text-emerald-900">{successMsg}</p>
                        <button onClick={() => { setRequestForm(null); setRequestStatus("idle"); }}
                          className="mt-3 text-sm text-emerald-700 hover:underline">{t.common.close}</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {listings.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">No solutions listed yet.</p>
                <p className="text-gray-400 mt-2">Complete a project and list it on the marketplace!</p>
              </div>
            )}
          </div>
        )}

        {/* How it works */}
        <div className="mt-16 bg-white rounded-2xl border border-gray-200 p-10">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t.marketplace.buildOnceTitle}</h3>
          <div className="grid sm:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Build a Solution", desc: "Teams collaborate to solve a real problem on Collabra.", icon: "🔨" },
              { step: "2", title: "Publish to Marketplace", desc: "List your completed solution with pricing and features.", icon: "📦" },
              { step: "3", title: "Others License It", desc: "Schools, NGOs, and companies pay monthly to use your solution.", icon: "🤝" },
              { step: "4", title: "Revenue Flows", desc: "70% to builders, 20% to Collabra, 10% to the problem creator.", icon: "💰" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h4 className="font-semibold text-gray-900">{item.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
