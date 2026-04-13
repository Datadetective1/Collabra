"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/context";

interface Stats {
  problemsPosted: number;
  projectsStarted: number;
  buildersJoined: number;
  solutionsShipped: number;
}

export default function Home() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats>({
    problemsPosted: 0,
    projectsStarted: 0,
    buildersJoined: 0,
    solutionsShipped: 0,
  });

  const [waitlist, setWaitlist] = useState({
    name: "",
    email: "",
    role: "developer",
    reason: "",
  });
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [waitlistMsg, setWaitlistMsg] = useState("");

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    setWaitlistStatus("loading");

    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(waitlist),
    });

    const data = await res.json();

    if (res.ok) {
      setWaitlistStatus("success");
      setWaitlistMsg(data.message);
      setWaitlist({ name: "", email: "", role: "developer", reason: "" });
    } else {
      setWaitlistStatus("error");
      setWaitlistMsg(data.error);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-24 sm:py-32 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight">
            {t.home.heroTitle}
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            {t.home.heroSubtitle}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              {t.common.joinWithInvite}
            </Link>
            <Link
              href="/explore"
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              {t.nav.explore}
            </Link>
            <Link
              href="/showcase"
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              {t.home.viewShowcase}
            </Link>
            <a
              href="#request-invite"
              className="border border-indigo-300 text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-indigo-50 transition"
            >
              {t.home.joinWaitlist}
            </a>
          </div>
        </div>
      </section>

      {/* Impact Counters */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: t.home.openProblems, value: stats.problemsPosted, color: "text-indigo-600" },
              { label: t.home.activeBounties, value: stats.projectsStarted, color: "text-blue-600" },
              { label: t.home.buildersActive, value: stats.buildersJoined, color: "text-green-600" },
              { label: t.home.solutionsBuilt, value: stats.solutionsShipped, color: "text-amber-600" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={`text-4xl sm:text-5xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 mt-2 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">{t.home.howItWorks}</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: "1", title: t.home.step1Title, desc: t.home.step1Desc },
            { step: "2", title: t.home.step2Title, desc: t.home.step2Desc },
            { step: "3", title: t.home.step3Title, desc: t.home.step3Desc },
            { step: "4", title: t.home.step4Title, desc: t.home.step4Desc },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                {item.step}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-gray-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Request Invite */}
      <section id="request-invite" className="bg-gray-900 text-white">
        <div className="max-w-2xl mx-auto px-4 py-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t.home.joinWaitlist}</h2>
            <p className="text-gray-400">{t.home.waitlistDesc}</p>
          </div>

          {waitlistStatus === "success" ? (
            <div className="bg-green-900/50 border border-green-700 rounded-xl p-8 text-center">
              <div className="text-3xl mb-3">&#10003;</div>
              <h3 className="text-xl font-semibold mb-2">{t.home.thankYou}</h3>
              <p className="text-green-300">{waitlistMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="space-y-5">
              {waitlistStatus === "error" && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm rounded-lg p-3">
                  {waitlistMsg}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t.home.yourName}</label>
                <input
                  type="text"
                  value={waitlist.name}
                  onChange={(e) => setWaitlist((p) => ({ ...p, name: e.target.value }))}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder={t.home.yourName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t.home.yourEmail}</label>
                <input
                  type="email"
                  value={waitlist.email}
                  onChange={(e) => setWaitlist((p) => ({ ...p, email: e.target.value }))}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t.home.yourRole}</label>
                <select
                  value={waitlist.role}
                  onChange={(e) => setWaitlist((p) => ({ ...p, role: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="problem_owner">{t.home.roleProblemOwner}</option>
                  <option value="builder">{t.home.roleBuilder}</option>
                  <option value="sponsor">{t.home.roleSponsor}</option>
                  <option value="organization">{t.home.roleOrganization}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t.home.whyJoin}</label>
                <textarea
                  value={waitlist.reason}
                  onChange={(e) => setWaitlist((p) => ({ ...p, reason: e.target.value }))}
                  required
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={waitlistStatus === "loading"}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {waitlistStatus === "loading" ? t.home.submitting : t.home.joinNow}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          {t.common.appName} — {t.footer.tagline}
        </div>
      </footer>
    </div>
  );
}
