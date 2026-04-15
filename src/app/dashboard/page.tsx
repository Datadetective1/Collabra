"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  points: number;
  teamMemberships: {
    role: string;
    project: {
      id: string;
      name: string;
      status: string;
      problem: { title: string; category: string };
    };
  }[];
}

interface InviteCode {
  code: string;
  used: boolean;
}

function getReputationLevel(points: number): string {
  if (points >= 500) return "Master Collaborator";
  if (points >= 250) return "Impact Leader";
  if (points >= 100) return "Problem Solver";
  if (points >= 30) return "Builder";
  return "Contributor";
}

function getLevelColor(points: number): string {
  if (points >= 500) return "bg-amber-100 text-amber-700";
  if (points >= 250) return "bg-purple-100 text-purple-700";
  if (points >= 100) return "bg-green-100 text-green-700";
  if (points >= 30) return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-700";
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/profile").then((r) => r.json()).then(setProfile);
      fetch("/api/invite-codes").then((r) => r.json()).then(setCodes);
    }
  }, [session]);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(""), 2000);
  }

  if (!profile) {
    return <div className="flex justify-center items-center min-h-[60vh] text-gray-500">{t.common.loading}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t.dashboard.welcome}, {profile.name}</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className={`${getLevelColor(profile.points)} px-3 py-1 rounded-full text-xs font-medium`}>
            {getReputationLevel(profile.points)}
          </span>
          <span className="text-sm text-gray-500">{profile.points} {t.talent.points}</span>
          <span className="text-sm text-gray-400 capitalize">{profile.role.replace("_", " ")}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* My Projects */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">{t.dashboard.yourProjects}</h2>
              <Link
                href="/problems"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {t.dashboard.browseProblems}
              </Link>
            </div>

            {profile.teamMemberships.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">{t.dashboard.noProjects}</p>
                <Link
                  href="/problems"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  {t.dashboard.findProblem}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.teamMemberships.map((tm) => (
                  <Link
                    key={tm.project.id}
                    href={`/projects/${tm.project.id}`}
                    className="block border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{tm.project.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{tm.project.problem.title}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full capitalize">
                          {tm.role}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          tm.project.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {tm.project.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Invite Codes */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.dashboard.inviteCodes}</h2>
            <p className="text-sm text-gray-500 mb-4">{t.dashboard.inviteCodesDesc}</p>

            <div className="space-y-3">
              {codes.map((c) => (
                <div
                  key={c.code}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    c.used ? "bg-gray-50 border-gray-200" : "bg-indigo-50 border-indigo-200"
                  }`}
                >
                  <code className={`text-sm font-mono ${c.used ? "text-gray-400 line-through" : "text-indigo-700"}`}>
                    {c.code}
                  </code>
                  {!c.used && (
                    <button
                      onClick={() => copyCode(c.code)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      {copied === c.code ? t.common.copied : t.common.copy}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
