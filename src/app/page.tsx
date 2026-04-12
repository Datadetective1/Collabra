"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Stats {
  problemsPosted: number;
  projectsStarted: number;
  buildersJoined: number;
  solutionsShipped: number;
}

export default function Home() {
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
            Turn Problems Into
            <span className="text-indigo-600"> Action</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Collabra is a global platform where people post real problems, form teams,
            and track progress toward real solutions. Execution over content.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Join with Invite Code
            </Link>
            <Link
              href="/explore"
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Explore Projects
            </Link>
            <Link
              href="/showcase"
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              View Showcase
            </Link>
            <a
              href="#request-invite"
              className="border border-indigo-300 text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-indigo-50 transition"
            >
              Request an Invite
            </a>
          </div>
        </div>
      </section>

      {/* Why Collabra Exists */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Why Collabra Exists</h2>
          <p className="text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto">
            Millions of real problems go unsolved — not because people don&apos;t care,
            but because they lack <span className="text-white font-semibold">coordination</span>.
          </p>
          <p className="mt-6 text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto">
            Collabra exists to turn ideas into organized action.
          </p>
          <div className="mt-8 flex justify-center gap-2 text-sm">
            <span className="bg-gray-800 text-gray-400 px-4 py-2 rounded-full">Not discussion.</span>
            <span className="bg-gray-800 text-gray-400 px-4 py-2 rounded-full">Not content.</span>
            <span className="bg-indigo-600 text-white px-4 py-2 rounded-full font-semibold">Execution.</span>
          </div>
        </div>
      </section>

      {/* Impact Counters */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Problems Posted", value: stats.problemsPosted, color: "text-indigo-600" },
              { label: "Projects Started", value: stats.projectsStarted, color: "text-blue-600" },
              { label: "Builders Joined", value: stats.buildersJoined, color: "text-green-600" },
              { label: "Solutions Shipped", value: stats.solutionsShipped, color: "text-amber-600" },
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
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">How Collabra Works</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: "1", title: "Post a Problem", desc: "Describe a real-world problem that needs solving." },
            { step: "2", title: "Form a Team", desc: "Builders, designers, and thinkers join to help." },
            { step: "3", title: "Build Together", desc: "Track tasks, hit milestones, and ship solutions." },
            { step: "4", title: "Earn Reputation", desc: "Gain points and rise from Contributor to Master Collaborator." },
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

      {/* Who Should Join */}
      <section className="bg-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Who Should Join Collabra?</h2>
          <p className="text-indigo-200 mb-12 max-w-xl mx-auto">
            If you want to build things that matter, you belong here.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { role: "Developers", icon: "{ }", desc: "Write the code" },
              { role: "Engineers", icon: "//", desc: "Architect solutions" },
              { role: "Designers", icon: "~", desc: "Shape the experience" },
              { role: "Students", icon: "A+", desc: "Learn by building" },
              { role: "Teachers", icon: "T", desc: "Guide and mentor" },
              { role: "Problem Solvers", icon: "?!", desc: "Spot what matters" },
            ].map((person) => (
              <div key={person.role} className="bg-indigo-700/50 rounded-xl p-5 hover:bg-indigo-700 transition">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-lg font-mono font-bold mx-auto mb-3">
                  {person.icon}
                </div>
                <h3 className="font-semibold text-sm">{person.role}</h3>
                <p className="text-indigo-200 text-xs mt-1">{person.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Starting with Education</h2>
          <p className="text-gray-600 mb-12 max-w-xl mx-auto">
            Our first problem category focuses on education — building tools that help students,
            teachers, and learners worldwide.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              "Homework Planner",
              "Reading Assistant",
              "Teacher Resources",
              "Student Collaboration",
            ].map((name) => (
              <div
                key={name}
                className="border border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-sm transition"
              >
                <h3 className="font-semibold text-gray-900">{name}</h3>
                <p className="text-sm text-gray-500 mt-1">Education</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reputation */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Reputation System</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { level: "Contributor", pts: "0+", color: "bg-gray-100 text-gray-700" },
            { level: "Builder", pts: "30+", color: "bg-blue-100 text-blue-700" },
            { level: "Problem Solver", pts: "100+", color: "bg-green-100 text-green-700" },
            { level: "Impact Leader", pts: "250+", color: "bg-purple-100 text-purple-700" },
            { level: "Master Collaborator", pts: "500+", color: "bg-amber-100 text-amber-700" },
          ].map((r) => (
            <div key={r.level} className={`${r.color} px-6 py-3 rounded-full text-sm font-medium`}>
              {r.level} ({r.pts} pts)
            </div>
          ))}
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {[
            { action: "Join Project", pts: "+5" },
            { action: "Complete Task", pts: "+10" },
            { action: "Complete Milestone", pts: "+30" },
            { action: "Complete Project", pts: "+100" },
          ].map((a) => (
            <div key={a.action} className="text-center p-4 bg-white rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-indigo-600">{a.pts}</div>
              <div className="text-sm text-gray-600 mt-1">{a.action}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Request Invite */}
      <section id="request-invite" className="bg-gray-900 text-white">
        <div className="max-w-2xl mx-auto px-4 py-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Request an Invite</h2>
            <p className="text-gray-400">
              Don&apos;t have an invite code? Tell us about yourself and we&apos;ll get you in.
            </p>
          </div>

          {waitlistStatus === "success" ? (
            <div className="bg-green-900/50 border border-green-700 rounded-xl p-8 text-center">
              <div className="text-3xl mb-3">&#10003;</div>
              <h3 className="text-xl font-semibold mb-2">You&apos;re on the list!</h3>
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
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={waitlist.name}
                  onChange={(e) => setWaitlist((p) => ({ ...p, name: e.target.value }))}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
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
                <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                <select
                  value={waitlist.role}
                  onChange={(e) => setWaitlist((p) => ({ ...p, role: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="developer">Developer</option>
                  <option value="engineer">Engineer</option>
                  <option value="designer">Designer</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="problem_solver">Problem Solver</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Why do you want to join?</label>
                <textarea
                  value={waitlist.reason}
                  onChange={(e) => setWaitlist((p) => ({ ...p, reason: e.target.value }))}
                  required
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                  placeholder="Tell us what problems you want to solve..."
                />
              </div>
              <button
                type="submit"
                disabled={waitlistStatus === "loading"}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {waitlistStatus === "loading" ? "Submitting..." : "Request Invite"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          Collabra — Turning meaningful problems into coordinated action.
        </div>
      </footer>
    </div>
  );
}
