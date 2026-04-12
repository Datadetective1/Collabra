import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;

  if (!url || !token) {
    console.error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env");
    process.exit(1);
  }

  const client = createClient({ url, authToken: token });
  const adapter = new PrismaLibSql({ url, authToken: token });
  const prisma = new PrismaClient({ adapter } as never);

  // Push schema tables first
  console.log("Creating tables...");
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'builder',
      "points" INTEGER NOT NULL DEFAULT 0,
      "bio" TEXT NOT NULL DEFAULT '',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

    CREATE TABLE IF NOT EXISTS "InviteCode" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "code" TEXT NOT NULL,
      "used" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "ownerId" TEXT NOT NULL,
      "usedById" TEXT,
      CONSTRAINT "InviteCode_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "InviteCode_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "InviteCode_code_key" ON "InviteCode"("code");
    CREATE UNIQUE INDEX IF NOT EXISTS "InviteCode_usedById_key" ON "InviteCode"("usedById");

    CREATE TABLE IF NOT EXISTS "Problem" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "category" TEXT NOT NULL DEFAULT 'education',
      "status" TEXT NOT NULL DEFAULT 'open',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "creatorId" TEXT NOT NULL,
      CONSTRAINT "Problem_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "Project" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'active',
      "isPublic" INTEGER NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "problemId" TEXT NOT NULL,
      CONSTRAINT "Project_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "Project_problemId_key" ON "Project"("problemId");

    CREATE TABLE IF NOT EXISTS "TeamMember" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "role" TEXT NOT NULL DEFAULT 'member',
      "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "userId" TEXT NOT NULL,
      "projectId" TEXT NOT NULL,
      CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "TeamMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "TeamMember_userId_projectId_key" ON "TeamMember"("userId", "projectId");

    CREATE TABLE IF NOT EXISTS "Task" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL DEFAULT '',
      "status" TEXT NOT NULL DEFAULT 'todo',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "projectId" TEXT NOT NULL,
      "assigneeId" TEXT,
      CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "Milestone" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "completed" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "projectId" TEXT NOT NULL,
      CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "PointLog" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "action" TEXT NOT NULL,
      "points" INTEGER NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "userId" TEXT NOT NULL,
      CONSTRAINT "PointLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "WaitlistEntry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "reason" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "WaitlistEntry_email_key" ON "WaitlistEntry"("email");
  `);
  console.log("Tables created!");

  // Seed data
  const passwordHash = await bcrypt.hash("collabra2024", 10);

  const founder = await prisma.user.upsert({
    where: { email: "founder@collabra.io" },
    update: {},
    create: {
      email: "founder@collabra.io",
      name: "Collabra Founder",
      passwordHash,
      role: "builder",
      bio: "Founder of Collabra - turning meaningful problems into coordinated action.",
    },
  });

  const codes = Array.from({ length: 20 }, (_, i) =>
    `COLLABRA-SEED-${String(i + 1).padStart(3, "0")}`
  );

  for (const code of codes) {
    await prisma.inviteCode.upsert({
      where: { code },
      update: {},
      create: { code, ownerId: founder.id },
    });
  }

  const seedProblems = [
    { title: "Homework Planner Tool for Students", description: "Students need a collaborative tool to plan, organize, and track homework assignments across different subjects. The tool should support group assignments, deadline reminders, and progress tracking." },
    { title: "Reading Practice Assistant", description: "Build an assistant that helps students improve their reading skills through structured practice sessions, vocabulary building, and comprehension tracking." },
    { title: "Teacher Resource Organizer", description: "Teachers need a way to organize, share, and collaborate on teaching resources including lesson plans, worksheets, and educational materials across departments." },
    { title: "Student Collaboration Platform", description: "Create a space where students from different schools and backgrounds can collaborate on educational projects, share knowledge, and learn from each other." },
  ];

  for (const problem of seedProblems) {
    const existing = await prisma.problem.findFirst({ where: { title: problem.title } });
    if (!existing) {
      await prisma.problem.create({
        data: { ...problem, category: "education", creatorId: founder.id },
      });
    }
  }

  console.log("Seed complete!");
  console.log("Founder: founder@collabra.io / collabra2024");
  console.log("Invite codes: COLLABRA-SEED-001 through COLLABRA-SEED-020");

  await prisma.$disconnect();
}

main().catch(console.error);
