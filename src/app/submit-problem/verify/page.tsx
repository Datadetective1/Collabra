"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useTranslation } from "@/lib/i18n/context";

type Phase = "checking" | "signing-in" | "error";

function VerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useTranslation();
  const token = params.get("token");

  const [phase, setPhase] = useState<Phase>("checking");
  const [errorReason, setErrorReason] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setPhase("error");
      setErrorReason("missing");
      return;
    }

    let cancelled = false;

    (async () => {
      // Step 1: sanity-check the token (expired? not found?) before we bother
      // NextAuth. Cleaner error UX.
      const checkRes = await fetch(
        `/api/submit-problem/verify?token=${encodeURIComponent(token)}`
      );
      if (cancelled) return;

      if (!checkRes.ok) {
        const data = await checkRes.json().catch(() => ({}));
        setErrorReason(data.reason || "invalid");
        setPhase("error");
        return;
      }

      const data = (await checkRes.json()) as {
        ok: boolean;
        alreadyConsumed?: boolean;
        problemId?: string;
      };

      // Step 2: sign in via the magic-link provider. The provider does the
      // user + problem creation transactionally on the server and returns a
      // session.
      setPhase("signing-in");
      const result = await signIn("magic-link", {
        token,
        redirect: false,
      });

      if (cancelled) return;

      if (!result?.ok) {
        setErrorReason("signin_failed");
        setPhase("error");
        return;
      }

      // Step 3: redirect. For a freshly-consumed token we don't know the
      // problemId client-side, so re-hit the verify endpoint (now idempotent:
      // consumed → returns problemId) and navigate there.
      let problemId = data.problemId;
      if (!problemId) {
        const followUp = await fetch(
          `/api/submit-problem/verify?token=${encodeURIComponent(token)}`
        );
        if (followUp.ok) {
          const followData = (await followUp.json()) as { problemId?: string };
          problemId = followData.problemId;
        }
      }

      if (cancelled) return;

      if (problemId) {
        router.replace(`/problems/${problemId}`);
      } else {
        // Fallback: session is valid but we couldn't resolve the problem.
        // Dashboard will show their problems.
        router.replace("/dashboard");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (phase === "error") {
    const message =
      errorReason === "expired"
        ? t.submitProblem.linkExpired
        : errorReason === "not_found" || errorReason === "missing"
          ? t.submitProblem.linkInvalid
          : t.submitProblem.linkError;

    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{message}</h1>
            <p className="text-sm text-gray-500 mb-6">
              {t.submitProblem.tryAgainHint}
            </p>
            <Link
              href="/submit-problem"
              className="inline-block bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700"
            >
              {t.submitProblem.tryAgain}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-600">
          {phase === "signing-in"
            ? t.submitProblem.publishing
            : t.common.loading}
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh]" />}>
      <VerifyContent />
    </Suspense>
  );
}
