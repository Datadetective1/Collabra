"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

const CATEGORIES = [
  "education",
  "healthcare",
  "environment",
  "agriculture",
  "technology",
  "community",
  "finance",
  "infrastructure",
  "employment",
  "general",
] as const;

type CategoryKey =
  | "education"
  | "healthcare"
  | "health"
  | "environment"
  | "agriculture"
  | "technology"
  | "community"
  | "finance"
  | "infrastructure"
  | "employment"
  | "general";

export default function SubmitProblemPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    email: "",
    title: "",
    description: "",
    category: "general",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/submit-problem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || t.common.error);
      setLoading(false);
      return;
    }

    router.push(`/submit-problem/sent?email=${encodeURIComponent(form.email)}`);
  }

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            {t.submitProblem.title}
          </h1>
          <p className="text-sm text-gray-500 text-center mb-8">
            {t.submitProblem.subtitle}
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.submitProblem.emailLabel}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="you@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t.submitProblem.emailHint}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.submitProblem.titleLabel}
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                required
                minLength={5}
                maxLength={200}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder={t.problems.titlePlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.problems.category}
              </label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t.problems.categories[c as CategoryKey]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.submitProblem.descLabel}
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                required
                minLength={20}
                maxLength={5000}
                rows={6}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder={t.problems.descriptionPlaceholder}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {loading ? t.submitProblem.submitting : t.submitProblem.submit}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            {t.submitProblem.noAccountNeeded}
          </p>

          <p className="mt-4 text-center text-sm text-gray-600">
            {t.auth.hasAccount}{" "}
            <Link
              href="/login"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {t.common.signIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
