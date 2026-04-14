"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerPoints: number;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  projectName: string | null;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string };
  project: { id: string; name: string } | null;
}

interface TeamMember {
  id: string;
  user: { id: string; name: string; points: number };
  projectId: string;
  project?: { name: string };
}

function getReputationLevel(points: number): string {
  if (points >= 500) return "Master Collaborator";
  if (points >= 250) return "Impact Leader";
  if (points >= 100) return "Problem Solver";
  if (points >= 30) return "Builder";
  return "Contributor";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const userId = (session?.user as { id?: string })?.id;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [teammates, setTeammates] = useState<TeamMember[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session) {
      loadConversations();
      loadTeammates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (selectedPartner) loadMessages(selectedPartner);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPartner]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages every 5s
  useEffect(() => {
    if (!selectedPartner) return;
    const interval = setInterval(() => loadMessages(selectedPartner), 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPartner]);

  function loadConversations() {
    fetch("/api/messages").then((r) => r.json()).then(setConversations).catch(() => {});
  }

  function loadMessages(partnerId: string) {
    fetch(`/api/messages/${partnerId}`).then((r) => r.json()).then(setMessages).catch(() => {});
  }

  function loadTeammates() {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((projects: { id: string; name: string; teamMembers: { id: string; user: { id: string; name: string; points: number } }[] }[]) => {
        const tms: TeamMember[] = [];
        for (const p of projects) {
          for (const tm of p.teamMembers) {
            if (tm.user.id !== userId) {
              tms.push({ ...tm, projectId: p.id, project: { name: p.name } });
            }
          }
        }
        // Dedupe by user id
        const seen = new Set<string>();
        setTeammates(tms.filter((tm) => {
          if (seen.has(tm.user.id)) return false;
          seen.add(tm.user.id);
          return true;
        }));
      })
      .catch(() => {});
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPartner) return;

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: selectedPartner, content: newMessage }),
    });

    setNewMessage("");
    loadMessages(selectedPartner);
    loadConversations();
  }

  function startChat(partnerId: string) {
    setSelectedPartner(partnerId);
    setShowNewChat(false);
  }

  const selectedName = conversations.find((c) => c.partnerId === selectedPartner)?.partnerName
    || teammates.find((t) => t.user.id === selectedPartner)?.user.name
    || "";

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Please <Link href="/login" className="text-indigo-600 hover:underline">sign in</Link> to view messages.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.messages.title}</h1>
        <button
          onClick={() => setShowNewChat(!showNewChat)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          {t.messages.newMessage}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            {/* New chat picker */}
            {showNewChat && (
              <div className="border-b border-gray-200 p-3 bg-indigo-50">
                <p className="text-xs font-medium text-indigo-700 mb-2">{t.messages.selectTeammate}</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {teammates.length === 0 ? (
                    <p className="text-xs text-gray-500">Join a project to message teammates.</p>
                  ) : (
                    teammates.map((tm) => (
                      <button
                        key={tm.user.id}
                        onClick={() => startChat(tm.user.id)}
                        className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded hover:bg-indigo-100 transition"
                      >
                        <div className="w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center text-xs font-medium text-indigo-700">
                          {tm.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{tm.user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{tm.project?.name}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 && !showNewChat ? (
                <div className="text-center py-12 px-4">
                  <p className="text-gray-500 text-sm">{t.messages.noConversations}</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.partnerId}
                    onClick={() => setSelectedPartner(conv.partnerId)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition ${
                      selectedPartner === conv.partnerId ? "bg-indigo-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-medium text-indigo-600 flex-shrink-0">
                        {conv.partnerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">{conv.partnerName}</p>
                          <span className="text-xs text-gray-400">{timeAgo(conv.lastMessageAt)}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col">
            {selectedPartner ? (
              <>
                {/* Chat header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-medium text-indigo-600">
                      {selectedName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{selectedName}</p>
                      <p className="text-xs text-gray-500">
                        {getReputationLevel(
                          conversations.find((c) => c.partnerId === selectedPartner)?.partnerPoints ||
                          teammates.find((t) => t.user.id === selectedPartner)?.user.points || 0
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50">
                  {messages.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-8">No messages yet. Say hello!</p>
                  )}
                  {messages.map((msg) => {
                    const isMe = msg.sender.id === userId;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] ${isMe ? "order-2" : ""}`}>
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm ${
                              isMe
                                ? "bg-indigo-600 text-white rounded-br-md"
                                : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
                            }`}
                          >
                            {msg.content}
                          </div>
                          <p className={`text-xs text-gray-400 mt-1 ${isMe ? "text-right" : ""}`}>
                            {timeAgo(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={sendMessage} className="px-6 py-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t.messages.typeMessage}
                      className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
                    >
                      {t.messages.send}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center px-4">
                <div>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">{t.messages.selectConversation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
