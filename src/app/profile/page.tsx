"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  points: number;
  bio: string;
  skills: string;
  available: boolean;
  createdAt: string;
  teamMemberships: {
    role: string;
    project: { id: string; name: string; status: string; problem: { title: string } };
  }[];
  pointLogs: { action: string; points: number; createdAt: string }[];
}

function getReputationLevel(points: number): string {
  if (points >= 500) return "Master Collaborator";
  if (points >= 250) return "Impact Leader";
  if (points >= 100) return "Problem Solver";
  if (points >= 30) return "Builder";
  return "Contributor";
}

function getLevelColor(points: number): string {
  if (points >= 500) return "bg-amber-100 text-amber-700 border-amber-200";
  if (points >= 250) return "bg-purple-100 text-purple-700 border-purple-200";
  if (points >= 100) return "bg-green-100 text-green-700 border-green-200";
  if (points >= 30) return "bg-blue-100 text-blue-700 border-blue-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

function getNextLevel(points: number): { name: string; threshold: number } | null {
  if (points >= 500) return null;
  if (points >= 250) return { name: "Master Collaborator", threshold: 500 };
  if (points >= 100) return { name: "Impact Leader", threshold: 250 };
  if (points >= 30) return { name: "Problem Solver", threshold: 100 };
  return { name: "Builder", threshold: 30 };
}

const actionLabels: Record<string, string> = {
  join_project: "Joined a project",
  complete_task: "Completed a task",
  complete_milestone: "Completed a milestone",
  complete_project: "Completed a project",
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/profile").then((r) => r.json()).then(setProfile);
    }
  }, [session]);

  if (!profile) {
    return <div className="flex justify-center items-center min-h-[60vh] text-gray-500">{t.common.loading}</div>;
  }

  const nextLevel = getNextLevel(profile.points);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
            <p className="text-gray-500 text-sm">{profile.email}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className={`${getLevelColor(profile.points)} px-4 py-1.5 rounded-full text-sm font-medium border`}>
                {getReputationLevel(profile.points)}
              </span>
              <span className="text-sm text-gray-600">{profile.points} {t.talent.points}</span>
              <span className="text-sm text-gray-400 capitalize">{profile.role.replace("_", " ")}</span>
            </div>
            {profile.bio && <p className="text-gray-600 mt-3">{profile.bio}</p>}
            {profile.skills && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.skills.split(",").map((s) => s.trim()).filter(Boolean).map((skill) => (
                  <span key={skill} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">{skill}</span>
                ))}
              </div>
            )}
            {profile.available && (
              <span className="inline-flex items-center gap-1.5 text-xs text-green-600 mt-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                {t.profile.available}
              </span>
            )}
          </div>
        </div>

        {/* Progress to next level */}
        {nextLevel && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progress to {nextLevel.name}</span>
              <span className="text-gray-500">{profile.points}/{nextLevel.threshold} pts</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${Math.min((profile.points / nextLevel.threshold) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Projects */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t.explore.title} ({profile.teamMemberships.length})
          </h2>
          {profile.teamMemberships.length === 0 ? (
            <p className="text-gray-500 text-sm">{t.dashboard.noProjects}</p>
          ) : (
            <div className="space-y-3">
              {profile.teamMemberships.map((tm, i) => (
                <Link
                  key={i}
                  href={`/projects/${tm.project.id}`}
                  className="block border border-gray-200 rounded-lg p-3 hover:border-indigo-300 transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tm.project.name}</p>
                      <p className="text-xs text-gray-500">{tm.role}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      tm.project.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {tm.project.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Point History */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.dashboard.recentActivity}</h2>
          {profile.pointLogs.length === 0 ? (
            <p className="text-gray-500 text-sm">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {profile.pointLogs.map((log, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700">{actionLabels[log.action] || log.action}</span>
                  <span className="text-sm font-medium text-indigo-600">+{log.points}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
