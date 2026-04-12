"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  problem: { title: string; description: string; category: string };
  teamMembers: { user: { name: string; points: number } }[];
  tasks: { status: string }[];
}

export default function ExplorePage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch("/api/projects").then((r) => r.json()).then(setProjects);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Explore Projects</h1>
        <p className="text-gray-500 mt-1">See what teams are building on Collabra</p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-4">No public projects yet.</p>
          <Link href="/problems" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Browse problems to get started
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const completedTasks = project.tasks.filter((t) => t.status === "done").length;
            const totalTasks = project.tasks.length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:border-indigo-300 hover:shadow-sm transition"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full capitalize">
                    {project.problem.category}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    project.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {project.status}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{project.problem.description}</p>

                {/* Progress bar */}
                {totalTasks > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{completedTasks}/{totalTasks} tasks</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Team */}
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {project.teamMembers.slice(0, 4).map((tm, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-medium text-indigo-600 border-2 border-white"
                      >
                        {tm.user.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">
                    {project.teamMembers.length} member{project.teamMembers.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
