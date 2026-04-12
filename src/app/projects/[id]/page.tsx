"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Project {
  id: string;
  name: string;
  status: string;
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
