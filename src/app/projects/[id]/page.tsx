"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Project {
  id: string;
  name: string;
  status: string;
  demoUrl: string;
  repoUrl: string;
  description: string;
  problem: { title: string; description: string; category: string; creator: { name: string } };
  teamMembers: {
    id: string;
    role: string;
    user: { id: string; name: string; points: number; role: string };
  }[];
  tasks: {
    id: string;
    title: string;
    description: string;
    status: string;
    assignee: { id: string; name: string } | null;
  }[];
  milestones: { id: string; title: string; completed: boolean }[];
}

function getReputationLevel(points: number): string {
  if (points >= 500) return "Master Collaborator";
  if (points >= 250) return "Impact Leader";
  if (points >= 100) return "Problem Solver";
  if (points >= 30) return "Builder";
  return "Contributor";
}

export default function ProjectPage() {
  const { data: session } = useSession();
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [newTask, setNewTask] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [editingLinks, setEditingLinks] = useState(false);
  const [linkForm, setLinkForm] = useState({ demoUrl: "", repoUrl: "", description: "" });

  const userId = (session?.user as { id?: string })?.id;

  useEffect(() => {
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  function loadProject() {
    fetch(`/api/projects/${params.id}`).then((r) => r.json()).then(setProject);
  }

  const isMember = project?.teamMembers.some((tm) => tm.user.id === userId);

  async function joinProject() {
    await fetch(`/api/projects/${params.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join" }),
    });
    loadProject();
  }

  async function saveSolutionLinks(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/projects/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(linkForm),
    });
    setEditingLinks(false);
    loadProject();
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;

    await fetch(`/api/projects/${params.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", title: newTask, description: taskDesc, assigneeId: userId }),
    });

    setNewTask("");
    setTaskDesc("");
    loadProject();
  }

  async function updateTaskStatus(taskId: string, status: string) {
    await fetch(`/api/projects/${params.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_status", taskId, status }),
    });
    loadProject();
  }

  if (!project) {
    return <div className="flex justify-center items-center min-h-[60vh] text-gray-500">Loading...</div>;
  }

  const tasksByStatus = {
    todo: project.tasks.filter((t) => t.status === "todo"),
    in_progress: project.tasks.filter((t) => t.status === "in_progress"),
    done: project.tasks.filter((t) => t.status === "done"),
  };

  const statusColumnStyles: Record<string, { bg: string; dot: string; label: string }> = {
    todo: { bg: "bg-gray-50", dot: "bg-gray-400", label: "To Do" },
    in_progress: { bg: "bg-blue-50", dot: "bg-blue-400", label: "In Progress" },
    done: { bg: "bg-green-50", dot: "bg-green-400", label: "Done" },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-2">{project.problem.description}</p>
            <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
              <span className="capitalize">{project.problem.category}</span>
              <span>Created by {project.problem.creator.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                project.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
              }`}>
                {project.status}
              </span>
            </div>
          </div>
          {session && !isMember && (
            <button
              onClick={joinProject}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Join Team
            </button>
          )}
        </div>

        {/* Solution description */}
        {project.description && (
          <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-lg p-4">
            <p className="text-sm font-medium text-indigo-900 mb-1">The Solution</p>
            <p className="text-sm text-indigo-700">{project.description}</p>
          </div>
        )}

        {/* Solution links */}
        {(project.demoUrl || project.repoUrl) && (
          <div className="mt-4 flex flex-wrap gap-3">
            {project.demoUrl && (
              <a href={project.demoUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100 transition">
                Live Demo
              </a>
            )}
            {project.repoUrl && (
              <a href={project.repoUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition">
                Source Code
              </a>
            )}
          </div>
        )}

        {/* Edit solution links (team members only) */}
        {isMember && (
          <div className="mt-4">
            {!editingLinks ? (
              <button
                onClick={() => {
                  setLinkForm({
                    demoUrl: project.demoUrl || "",
                    repoUrl: project.repoUrl || "",
                    description: project.description || "",
                  });
                  setEditingLinks(true);
                }}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Edit Solution Links
              </button>
            ) : (
              <form onSubmit={saveSolutionLinks} className="space-y-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Solution Description</label>
                  <textarea
                    value={linkForm.description}
                    onChange={(e) => setLinkForm((p) => ({ ...p, description: e.target.value }))}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                    placeholder="Describe what was built..."
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Demo URL</label>
                    <input
                      type="url"
                      value={linkForm.demoUrl}
                      onChange={(e) => setLinkForm((p) => ({ ...p, demoUrl: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="https://demo.example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Repo URL</label>
                    <input
                      type="url"
                      value={linkForm.repoUrl}
                      onChange={(e) => setLinkForm((p) => ({ ...p, repoUrl: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="https://github.com/..."
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                    Save
                  </button>
                  <button type="button" onClick={() => setEditingLinks(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Task Board */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Board</h2>

            {/* Add task form */}
            {isMember && (
              <form onSubmit={createTask} className="mb-6 flex gap-3">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="New task title..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <input
                  type="text"
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Add
                </button>
              </form>
            )}

            {/* Columns */}
            <div className="grid md:grid-cols-3 gap-4">
              {(["todo", "in_progress", "done"] as const).map((status) => {
                const style = statusColumnStyles[status];
                const tasks = tasksByStatus[status];
                return (
                  <div key={status} className={`${style.bg} rounded-lg p-4`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                      <h3 className="text-sm font-medium text-gray-700">{style.label}</h3>
                      <span className="text-xs text-gray-400 ml-auto">{tasks.length}</span>
                    </div>
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <div key={task.id} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                          <p className="text-sm font-medium text-gray-900">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                          )}
                          {task.assignee && (
                            <p className="text-xs text-gray-400 mt-2">{task.assignee.name}</p>
                          )}
                          {isMember && status !== "done" && (
                            <button
                              onClick={() =>
                                updateTaskStatus(
                                  task.id,
                                  status === "todo" ? "in_progress" : "done"
                                )
                              }
                              className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                              {status === "todo" ? "Start" : "Complete"}
                            </button>
                          )}
                        </div>
                      ))}
                      {tasks.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-4">No tasks</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Team sidebar */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Team ({project.teamMembers.length})
            </h2>
            <div className="space-y-3">
              {project.teamMembers.map((tm) => (
                <div key={tm.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-medium text-indigo-600">
                    {tm.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{tm.user.name}</p>
                    <p className="text-xs text-gray-500">
                      {getReputationLevel(tm.user.points)} · {tm.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
