import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Light verification: check whether a pending submission token is usable.
 *
 * This endpoint does NOT mutate data. The actual "consume token, create user,
 * create problem" work happens transactionally inside the NextAuth magic-link
 * provider's authorize() — that way the DB write and the session issue are
 * tied together and a half-finished state is impossible.
 *
 * The verify page calls this first to show a clean error if the link is
 * already expired/consumed, before bothering NextAuth.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ ok: false, reason: "missing_token" }, { status: 400 });
  }

  const row = await prisma.pendingProblemSubmission.findUnique({
    where: { token },
  });

  if (!row) {
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  }

  // If already consumed, the client can still redirect straight to the problem.
  if (row.consumedAt && row.resultProblemId) {
    return NextResponse.json({
      ok: true,
      alreadyConsumed: true,
      problemId: row.resultProblemId,
    });
  }

  if (row.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ ok: false, reason: "expired" }, { status: 410 });
  }

  return NextResponse.json({
    ok: true,
    title: row.title,
    email: row.email,
  });
}
