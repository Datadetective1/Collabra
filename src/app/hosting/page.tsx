"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface License {
  id: string;
  status: string;
  licensee: string;
  email: string;
  orgName: string;
  instanceUrl: string;
  instanceStatus: string;
  accessKey: string;
  dataRegion: string;
  storageUsed: number;
  monthlyUsage: number;
  createdAt: string;
}

interface HostedListing {
  id: string;
  published: boolean;
  priceMonthly: number;
  tagline: string;
  features: string;
  totalRevenue: number;
  builderSplit: number;
  platformSplit: number;
  creatorSplit: number;
  hostingStatus: string;
  hostingUrl: string;
  hostingRegion: string;
  hostingTier: string;
  setupDocs: string;
  techStack: string;
  project: {
    name: string;
    problem: { title: string; category: string; creator: { name: string } };
    teamMembers: { user: { id: string; name: string } }[];
  };
  licenses: License[];
}

interface PlatformStats {
  totalSolutions: number;
  runningSolutions: number;
  totalInstances: number;
  activeInstances: number;
  totalRevenue: number;
  platformRevenue: number;
}

const statusStyles: Record<string, { bg: string; dot: string; label: string }> = {
  running: { bg: "bg-green-50", dot: "bg-green-500", label: "Running" },
  stopped: { bg: "bg-red-50", dot: "bg-red-500", label: "Stopped" },
  pending: { bg: "bg-yellow-50", dot: "bg-yellow-500", label: "Pending" },
  provisioning: { bg: "bg-blue-50", dot: "bg-blue-500", label: "Provisioning" },
  deploying: { bg: "bg-blue-50", dot: "bg-blue-500", label: "Deploying" },
};

const tierInfo: Record<string, { name: string; cpu: string; ram: string; storage: string; price: string }> = {
  starter: { name: "Starter", cpu: "1 vCPU", ram: "512 MB", storage: "5 GB", price: "$5/mo" },
  growth: { name: "Growth", cpu: "2 vCPU", ram: "2 GB", storage: "25 GB", price: "$20/mo" },
  scale: { name: "Scale", cpu: "4 vCPU", ram: "8 GB", storage: "100 GB", price: "$75/mo" },
  enterprise: { name: "Enterprise", cpu: "8 vCPU", ram: "32 GB", storage: "500 GB", price: "$200/mo" },
};

const regionNames: Record<string, string> = {
  "us-east-1": "US East (Virginia)",
  "us-west-2": "US West (Oregon)",
  "eu-west-1": "Europe (Ireland)",
  "ap-south-1": "Asia Pacific (Mumbai)",
  "af-south-1": "Africa (Cape Town)",
};

export default function HostingPage() {
  const { data: session } = useSession();
  const [listings, setListings] = useState<HostedListing[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [configForm, setConfigForm] = useState<{ listingId: string; tier: string; region: string; techStack: string; setupDocs: string } | null>(null);

  useEffect(() => {
    if (session) loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  function loadData() {
    fetch("/api/hosting")
      .then((r) => r.json())
      .then((data) => {
        setListings(data.listings || []);
        setStats(data.platformStats || null);
      })
      .catch(() => {});
  }

  async function hostingAction(listingId: string, action: string) {
    await fetch("/api/hosting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, action }),
    });
    loadData();
  }

  async function updateConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!configForm) return;
    await fetch("/api/hosting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: configForm.listingId,
        action: "update_config",
        hostingTier: configForm.tier,
        hostingRegion: configForm.region,
        techStack: configForm.techStack,
        setupDocs: configForm.setupDocs,
      }),
    });
    setConfigForm(null);
    loadData();
  }

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Please <Link href="/login" className="text-indigo-600 hover:underline">sign in</Link> to access hosting.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Hosting Dashboard</h1>
              <p className="mt-2 text-gray-400">Manage deployments, instances, and infrastructure</p>
            </div>
            <Link href="/marketplace" className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600 transition">
              View Marketplace
            </Link>
          </div>

          {/* Platform stats */}
          {stats && (
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Solutions", value: stats.totalSolutions, color: "text-blue-400" },
                { label: "Running", value: stats.runningSolutions, color: "text-green-400" },
                { label: "Instances", value: stats.totalInstances, color: "text-purple-400" },
                { label: "Active", value: stats.activeInstances, color: "text-emerald-400" },
                { label: "Total Revenue", value: "$" + stats.totalRevenue.toLocaleString(), color: "text-amber-400" },
                { label: "Platform (20%)", value: "$" + stats.platformRevenue.toLocaleString(), color: "text-indigo-400" },
              ].map((s) => (
                <div key={s.label} className="bg-gray-800/50 rounded-lg p-4">
                  <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Solutions */}
      <div className="max-w-6xl mx-auto px-4 py-8 w-full">
        {listings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">No hosted solutions yet.</p>
            <p className="text-gray-400 text-sm mt-1">Complete a project and list it on the marketplace to start hosting.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {listings.map((listing) => {
              const status = statusStyles[listing.hostingStatus] || statusStyles.pending;
              const tier = tierInfo[listing.hostingTier] || tierInfo.starter;
              const isExpanded = expanded === listing.id;
              const builderRev = Math.round(listing.totalRevenue * listing.builderSplit / 100);

              return (
                <div key={listing.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Solution header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-lg font-bold text-gray-900">{listing.project.problem.title}</h2>
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        </div>
                        {listing.hostingUrl && (
                          <a href={listing.hostingUrl} target="_blank" rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:underline">{listing.hostingUrl}</a>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{tier.name} — {tier.cpu}, {tier.ram}, {tier.storage}</span>
                          <span>{regionNames[listing.hostingRegion] || listing.hostingRegion}</span>
                          {listing.techStack && (
                            <span className="flex gap-1">
                              {listing.techStack.split(",").map((t) => (
                                <span key={t} className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{t.trim()}</span>
                              ))}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {listing.hostingStatus === "running" && (
                          <button onClick={() => hostingAction(listing.id, "stop")}
                            className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">Stop</button>
                        )}
                        {listing.hostingStatus === "stopped" && (
                          <button onClick={() => hostingAction(listing.id, "restart")}
                            className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 transition">Restart</button>
                        )}
                        <button onClick={() => setConfigForm(configForm?.listingId === listing.id ? null : {
                          listingId: listing.id, tier: listing.hostingTier, region: listing.hostingRegion,
                          techStack: listing.techStack, setupDocs: listing.setupDocs,
                        })}
                          className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">Configure</button>
                        <button onClick={() => setExpanded(isExpanded ? null : listing.id)}
                          className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">
                          {isExpanded ? "Collapse" : `Instances (${listing.licenses.length})`}
                        </button>
                      </div>
                    </div>

                    {/* Revenue bar */}
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                        <div className="bg-emerald-500 h-full" style={{ width: `${listing.builderSplit}%` }} />
                        <div className="bg-indigo-500 h-full" style={{ width: `${listing.platformSplit}%` }} />
                        <div className="bg-amber-500 h-full" style={{ width: `${listing.creatorSplit}%` }} />
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-600 font-medium">${builderRev} builders</span>
                        <span className="text-indigo-600 font-medium">${Math.round(listing.totalRevenue * 0.2)} platform</span>
                        <span className="text-amber-600 font-medium">${Math.round(listing.totalRevenue * 0.1)} creator</span>
                      </div>
                    </div>

                    {/* Config form */}
                    {configForm?.listingId === listing.id && (
                      <form onSubmit={updateConfig} className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Hosting Tier</label>
                            <select value={configForm.tier} onChange={(e) => setConfigForm({ ...configForm, tier: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none">
                              <option value="starter">Starter — 1 vCPU, 512 MB ($5/mo)</option>
                              <option value="growth">Growth — 2 vCPU, 2 GB ($20/mo)</option>
                              <option value="scale">Scale — 4 vCPU, 8 GB ($75/mo)</option>
                              <option value="enterprise">Enterprise — 8 vCPU, 32 GB ($200/mo)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Region</label>
                            <select value={configForm.region} onChange={(e) => setConfigForm({ ...configForm, region: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none">
                              {Object.entries(regionNames).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Tech Stack (comma-separated)</label>
                          <input type="text" value={configForm.techStack} onChange={(e) => setConfigForm({ ...configForm, techStack: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Next.js, PostgreSQL, Redis" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Setup Documentation</label>
                          <textarea rows={3} value={configForm.setupDocs} onChange={(e) => setConfigForm({ ...configForm, setupDocs: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none resize-none"
                            placeholder="Environment variables, configuration steps, API keys needed..." />
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">Save Config</button>
                          <button type="button" onClick={() => setConfigForm(null)} className="text-sm text-gray-500 px-4 py-2">Cancel</button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Instances table */}
                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      <div className="px-6 py-3 bg-gray-50 text-xs font-medium text-gray-500 grid grid-cols-7 gap-4">
                        <span>Organization</span>
                        <span>Instance URL</span>
                        <span>Status</span>
                        <span>Region</span>
                        <span>Storage</span>
                        <span>Requests/mo</span>
                        <span>Access Key</span>
                      </div>
                      {listing.licenses.map((lic) => {
                        const iStatus = statusStyles[lic.instanceStatus] || statusStyles.provisioning;
                        return (
                          <div key={lic.id} className="px-6 py-3 border-t border-gray-100 text-sm grid grid-cols-7 gap-4 items-center hover:bg-gray-50">
                            <div>
                              <p className="font-medium text-gray-900">{lic.orgName || lic.licensee}</p>
                              <p className="text-xs text-gray-500">{lic.email}</p>
                            </div>
                            <div>
                              {lic.instanceUrl ? (
                                <a href={lic.instanceUrl} target="_blank" rel="noopener noreferrer"
                                  className="text-indigo-600 hover:underline text-xs break-all">{lic.instanceUrl}</a>
                              ) : <span className="text-gray-400 text-xs">Not provisioned</span>}
                            </div>
                            <div>
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${iStatus.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${iStatus.dot}`} />
                                {iStatus.label}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">{regionNames[lic.dataRegion] || lic.dataRegion}</div>
                            <div className="text-xs text-gray-600">{lic.storageUsed} MB</div>
                            <div className="text-xs text-gray-600">{lic.monthlyUsage.toLocaleString()}</div>
                            <div className="text-xs font-mono text-gray-400 truncate">{lic.accessKey || "—"}</div>
                          </div>
                        );
                      })}
                      {listing.licenses.length === 0 && (
                        <div className="px-6 py-8 text-center text-gray-400 text-sm">No instances yet</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
