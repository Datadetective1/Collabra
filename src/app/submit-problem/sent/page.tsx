"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

function SentContent() {
  const { t } = useTranslation();
  const params = useSearchParams();
  const email = params.get("email") || "";

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t.submitProblem.sentTitle}
          </h1>

          <p className="text-sm text-gray-600 mb-1">
            {t.submitProblem.sentBody}
          </p>
          {email && (
            <p className="text-sm font-medium text-gray-900 mb-6">{email}</p>
          )}

          <p className="text-xs text-gray-500 mb-6">
            {t.submitProblem.sentHint}
          </p>

          <Link
            href="/"
            className="inline-block text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← {t.common.back}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SentPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh]" />}>
      <SentContent />
    </Suspense>
  );
}
