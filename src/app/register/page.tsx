"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "builder",
    inviteCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }

    // Auto sign in
    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.ok) {
      router.push("/dashboard");
    }
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">{t.auth.registerTitle}</h1>
          <p className="text-sm text-gray-500 text-center mb-8">{t.auth.registerSubtitle}</p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-6">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.inviteCode}</label>
              <input
                type="text"
                value={form.inviteCode}
                onChange={(e) => update("inviteCode", e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                placeholder="COLLABRA-XXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.name}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.email}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.password}</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
                minLength={6}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.home.yourRole}</label>
              <select
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="builder">{t.auth.roleDeveloper}</option>
                <option value="designer">{t.auth.roleDesigner}</option>
                <option value="student">{t.auth.roleStudent}</option>
                <option value="teacher">{t.auth.roleTeacher}</option>
                <option value="problem_creator">{t.auth.roleProblemCreator}</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {loading ? t.auth.registering : t.auth.register}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            {t.auth.hasAccount}{" "}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              {t.common.signIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
