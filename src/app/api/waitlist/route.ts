import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, role, reason } = body;

  if (!name || !email || !role || !reason) {
    return Response.json({ error: "All fields are required" }, { status: 400 });
  }

  const existing = await prisma.waitlistEntry.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "You're already on the waitlist!" }, { status: 400 });
  }

  await prisma.waitlistEntry.create({
    data: { name, email, role, reason },
  });

  return Response.json({ message: "You've been added to the waitlist!" });
}
