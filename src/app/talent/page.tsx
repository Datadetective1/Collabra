"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface TalentProfile {
  id: string;
  name: string;
  bio: string;
  skills: string[];
  points: number;
  available: boolean;
  projectCount: number;
  completedProjects: number;
  tasksCompleted: number;
  joinedAt: string;
}

function getReputationLevel(points: number) {
  if (points >= 500) return { level: "Master Collaborator", color: "bg-amber-100 text-amber-700" };
  if (points >= 250) return { level: "Impact Leader", color: "bg-purple-100 text-purple-700" };
  if (points >= 100) return { level: "Problem Solver", color: "bg-green-100 text-green-700" };
  if (points >= 30) return { level: "Builder", color: "bg-blue-100 text-blue-700" };
  return { level: "Contributor", color: "bg-gray-100 text-gray-700" };
}

export default function TalentPage() {
  const [talent, setTalent] = useState<TalentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/talent")
      .then((r) => r.json())
      .then((data) => { setTalent(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter
    ? talent.filter((t) =>
        t.skills.some((s) => s.toLowerCase().includes(filter.toLowerCase())) ||
        t.name.toLowerCase().includes(filter.toLowerCase())
      )
    : talent;

  const allSkills = [...new Set(talent.flatMap((t) => t.skills))].filter(Boolean).sort();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-700 via-purple-800 to-indigo-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Talent Directory
          </h1>
          <p className="mt-4 text-lg text-purple-200 max-w-2xl mx-auto">
            Discover top builders with proven track records. Every contribution is verified through real projects.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold">{talent.length}</div>
              <div className="text-purple-200 text-sm mt-1">Active Builders</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{allSkills.length}</div>
              <div className="text-purple-200 text-sm mt-1">Unique Skills</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{talent.reduce((s, t) => s + t.tasksCompleted, 0)}</div>
              <div className="text-purple-200 text-sm mt-1">Tasks Shipped</div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10 w-full">
        {/* Filter */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by name or skill..."
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm flex-1 min-w-[250px] focus:ring-2 focus:ring-purple-500 outline-none"
          />
          {allSkills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allSkills.slice(0, 8).map((skill) => (
                <button
                  key={skill}
                  onClick={() => setFilter(filter === skill ? "" : skill)}
                  className={`text-xs px-3 py-1.5 rounded-full transition ${
                    filter === skill ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading talent...</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((person) => {
              const rep = getReputationLevel(person.points);
              return (
                <div key={person.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center text-xl font-bold text-purple-600 flex-shrink-0">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{person.name}</h3>
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${rep.color}`}>
                        {rep.level}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-600">{person.points}</div>
                      <div className="text-xs text-gray-400">pts</div>
                    </div>
                  </div>

                  {/* Bio */}
                  {person.bio && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">{person.bio}</p>
                  )}

                  {/* Skills */}
                  {person.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {person.skills.map((skill) => (
                        <span key={skill} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-sm font-bold text-gray-900">{person.projectCount}</div>
                      <div className="text-xs text-gray-500">Projects</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{person.completedProjects}</div>
                      <div className="text-xs text-gray-500">Shipped</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{person.tasksCompleted}</div>
                      <div className="text-xs text-gray-500">Tasks</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/messages`}
                      className="flex-1 text-center bg-purple-50 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-100 transition"
                    >
                      Message
                    </Link>
                    {person.available && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        Available
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500">No builders match your search.</p>
          </div>
        )}

        {/* For Companies CTA */}
        <div className="mt-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-3">Looking to hire top builders?</h3>
          <p className="text-purple-200 mb-6 max-w-xl mx-auto">
            Every builder on Collabra has a verified track record of shipping real solutions.
            Browse profiles, see completed projects, and recruit proven talent.
          </p>
          <Link
            href="/#request-invite"
            className="inline-block bg-white text-purple-700 px-6 py-3 rounded-lg font-medium hover:bg-purple-50 transition"
          >
            Contact Us for Recruiting
          </Link>
        </div>
      </div>
    </div>
  );
}
