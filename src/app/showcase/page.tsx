"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface ShowcaseProject {
  id: string;
  name: string;
  status: string;
  demoUrl: string;
  repoUrl: string;
  description: string;
  problem: { title: string; description: string; category: string; creator: { name: string } };
  teamMembers: { user: { name: string; points: number } }[];
  tasks: { id: string; status: string }[];
  milestones: { id: string; title: string; completed: boolean }[];
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    health: "bg-rose-100 text-rose-700",
    agriculture: "bg-emerald-100 text-emerald-700",
    employment: "bg-amber-100 text-amber-700",
    education: "bg-blue-100 text-blue-700",
  };
  return colors[category] || "bg-gray-100 text-gray-700";
}

export default function ShowcasePage() {
  const [projects, setProjects] = useState<ShowcaseProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/showcase")
      .then((r) => r.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Solutions That <span className="text-indigo-400">Ship</span>
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Real problems. Real teams. Real impact. These projects were built by
            Collabra teams turning ideas into action.
          </p>
        </div>
      </section>

      {/* Projects */}
      <section className="max-w-6xl mx-auto px-4 py-16 w-full">
        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No completed projects yet.</p>
            <p className="text-gray-400 mt-2">Be the first to ship a solution!</p>
            <Link
              href="/explore"
              className="inline-block mt-6 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Explore Problems
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {projects.map((project) => {
              const doneTasks = project.tasks.filter((t) => t.status === "done").length;
              const completedMilestones = project.milestones.filter((m) => m.completed).length;

              return (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Category bar */}
                  <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />

                  <div className="p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${getCategoryColor(project.problem.category)}`}>
                            {project.problem.category}
                          </span>
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                            Completed
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">{project.problem.title}</h2>
                        <p className="mt-2 text-gray-600">{project.problem.description}</p>

                        {project.description && (
                          <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                            <p className="text-sm font-medium text-indigo-900 mb-1">The Solution</p>
                            <p className="text-sm text-indigo-700">{project.description}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span><strong className="text-gray-900">{doneTasks}</strong> tasks completed</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span><strong className="text-gray-900">{completedMilestones}</strong> milestones hit</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span><strong className="text-gray-900">{project.teamMembers.length}</strong> team members</span>
                      </div>
                    </div>

                    {/* Milestones */}
                    <div className="mt-5 flex flex-wrap gap-2">
                      {project.milestones.map((m) => (
                        <span
                          key={m.id}
                          className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full ${
                            m.completed ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"
                          }`}
                        >
                          {m.completed ? (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" strokeWidth={2} />
                            </svg>
                          )}
                          {m.title}
                        </span>
                      ))}
                    </div>

                    {/* Team + Links */}
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-gray-100">
                      {/* Team avatars */}
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {project.teamMembers.slice(0, 5).map((tm, i) => (
                            <div
                              key={i}
                              className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-medium text-indigo-600 border-2 border-white"
                              title={tm.user.name}
                            >
                              {tm.user.name.charAt(0).toUpperCase()}
                            </div>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          Built by {project.teamMembers.map((tm) => tm.user.name).join(", ")}
                        </span>
                      </div>

                      {/* Action links */}
                      <div className="flex items-center gap-3">
                        {project.demoUrl && (
                          <a
                            href={project.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100 transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Live Demo
                          </a>
                        )}
                        {project.repoUrl && (
                          <a
                            href={project.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            Source Code
                          </a>
                        )}
                        <Link
                          href={`/projects/${project.id}`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition"
                        >
                          View Details
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 text-white">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Want to build something that matters?</h2>
          <p className="text-indigo-200 mb-8">
            Join Collabra and turn real problems into real solutions.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-indigo-50 transition"
            >
              Join with Invite Code
            </Link>
            <a
              href="/#request-invite"
              className="border border-white/30 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Request an Invite
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
