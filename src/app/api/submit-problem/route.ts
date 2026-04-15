import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { sendProblemMagicLink } from "@/lib/email";

const VALID_CATEGORIES = new Set([
  "education",
  "healthcare",
  "health",
  "environment",
  "agriculture",
  "technology",
  "community",
  "finance",
  "infrastructure",
  "employment",
  "general",
]);

const TITLE_MAX = 200;
const DESC_MAX = 5000;
const EMAIL_MAX = 254;
const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Per-IP rate limit: 3 submissions / hour. Simple in-memory store — resets on
// server restart, which is fine at MVP scale.
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
type RateEntry = { count: number; resetAt: number };
const rateStore: Map<string, RateEntry> = (globalThis as unknown as {
  __collabraSubmitRate?: Map<string, RateEntry>;
}).__collabraSubmitRate || new Map();
(globalThis as unknown as { __collabraSubmitRate?: Map<string, RateEntry> }).__collabraSubmitRate = rateStore;

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const entry = rateStore.get(ip);
  if (!entry || entry.resetAt < now) {
    rateStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { allowed: true };
}

function isValidEmail(s: string): boolean {
  // Conservative, deliberately simple. Server-side validation is a gate against
  // obvious garbage — real deliverability is proven by clicking the link.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= EMAIL_MAX;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, title, description, category } = (body ?? {}) as {
    email?: unknown;
    title?: unknown;
    description?: unknown;
    category?: unknown;
  };

  // --- validate ---
  if (typeof email !== "string" || !isValidEmail(email.trim())) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (typeof title !== "string" || title.trim().length < 5) {
    return NextResponse.json({ error: "Title must be at least 5 characters." }, { status: 400 });
  }
  if (title.length > TITLE_MAX) {
    return NextResponse.json({ error: `Title must be under ${TITLE_MAX} characters.` }, { status: 400 });
  }
  if (typeof description !== "string" || description.trim().length < 20) {
    return NextResponse.json(
      { error: "Description must be at least 20 characters." },
      { status: 400 }
    );
  }
  if (description.length > DESC_MAX) {
    return NextResponse.json({ error: `Description must be under ${DESC_MAX} characters.` }, { status: 400 });
  }
  const cat = typeof category === "string" && VALID_CATEGORIES.has(category) ? category : "general";

  // --- rate limit ---
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later.", retryAfterSec: rl.retryAfterSec },
      { status: 429 }
    );
  }

  // --- persist pending row ---
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  const normalizedEmail = email.trim().toLowerCase();

  await prisma.pendingProblemSubmission.create({
    data: {
      email: normalizedEmail,
      title: title.trim(),
      description: description.trim(),
      category: cat,
      token,
      expiresAt,
    },
  });

  // --- send email ---
  const result = await sendProblemMagicLink({
    to: normalizedEmail,
    token,
    problemTitle: title.trim(),
  });

  if (!result.ok) {
    // Soft-fail: the row exists, the token is valid. Surface an error but don't
    // leak that email delivery is the problem (could be a typo in their address).
    return NextResponse.json(
      { error: "We couldn't send the email. Please check the address and try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
