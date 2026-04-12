"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Problem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdAt: string;
  creator: { id: string; name: string; points: number };
  project: { teamMembers: { id: string }[] } | null;
}

export default function ProblemsPage() {
  const { data: session } = useSession();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("education");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProblems();
  }, []);

  function loadProblems() {
    fetch("/api/problems").then((r) => r.json()).then(setProblems);
  }

  async function handleCreateProblem(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    await fetch("/api/problems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, category }),
    });

    setTitle("");
    setDescription("");
    setShowForm(false);
    setSubmitting(false);
    loadProblems();
  }

  async function handleStartProject(problemId: string, problemTitle: string) {
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId, name: problemTitle }),
    });
    loadProblems();
  }

  const statusColors: Record<string, string> = {
    open: "bg-green-100 text-green-700",
    in_progress: "bg-blue-100 text-blue-700",
    solved: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Problems</h1>
          <p className="text-gray-500 mt-1">Real-world problems looking for teams and solutions</p>
        </div>
        {session && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            {showForm ? "Cancel" : "Post a Problem"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Post a New Problem</h2>
          <form onSubmit={handleCreateProblem} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Problem Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="e.g., Students need a better way to organize homework"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                placeholder="Describe the problem in detail. Who is affected? What's the impact?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="education">Education</option>
                <option value="health">Health</option>
                <option value="environment">Environment</option>
                <option value="community">Community</option>
                <option value="technology">Technology</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Post Problem"}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {problems.map((problem) => (
          <div key={problem.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{problem.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[problem.status]}`}>
                    {problem.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{problem.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="capitalize">{problem.category}</span>
                  <span>Posted by {problem.creator.name}</span>
                  {problem.project && (
                    <span>{problem.project.teamMembers.length} team members</span>
                  )}
                </div>
              </div>
              <div className="ml-4">
                {problem.project ? (
                  <Link
                    href={`/projects/${(problem as unknown as { project: { id: string } }).project?.id || ""}`}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    View Project
                  </Link>
                ) : (
                  session && (
                    <button
                      onClick={() => handleStartProject(problem.id, problem.title)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                    >
                      Start Project
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        ))}

        {problems.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p>No problems posted yet. Be the first to post one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
