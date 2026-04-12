import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password, name, role, inviteCode } = body;

  if (!email || !password || !name || !inviteCode) {
    return Response.json({ error: "All fields are required" }, { status: 400 });
  }

  // Validate invite code
  const invite = await prisma.inviteCode.findUnique({
    where: { code: inviteCode },
  });

  if (!invite || invite.used) {
    return Response.json({ error: "Invalid or used invite code" }, { status: 400 });
  }

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "Email already registered" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, name, passwordHash, role: role || "builder" },
  });

  // Mark invite code as used
  await prisma.inviteCode.update({
    where: { id: invite.id },
    data: { used: true, usedById: user.id },
  });

  // Generate invite codes for the new user (3 codes)
  const codes = Array.from({ length: 3 }, () =>
    `COLLABRA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  );

  await prisma.inviteCode.createMany({
    data: codes.map((code) => ({ code, ownerId: user.id })),
  });

  return Response.json({ message: "Account created", userId: user.id });
}
