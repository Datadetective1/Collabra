import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });

import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function run(sql: string, label: string) {
  try {
    await client.execute(sql);
    console.log("OK:", label);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("duplicate column") || msg.includes("already exists")) {
      console.log("Already exists:", label);
    } else {
      console.error("Error:", label, msg);
    }
  }
}

async function main() {
  console.log("Adding monetization tables and columns to Turso...\n");

  // User fields
  await run('ALTER TABLE "User" ADD COLUMN "skills" TEXT NOT NULL DEFAULT \'\'', "User.skills");
  await run('ALTER TABLE "User" ADD COLUMN "available" INTEGER NOT NULL DEFAULT 1', "User.available");

  // Problem fields
  await run('ALTER TABLE "Problem" ADD COLUMN "bountyAmount" INTEGER NOT NULL DEFAULT 0', "Problem.bountyAmount");
  await run('ALTER TABLE "Problem" ADD COLUMN "bountyStatus" TEXT NOT NULL DEFAULT \'none\'', "Problem.bountyStatus");
  await run('ALTER TABLE "Problem" ADD COLUMN "sponsorName" TEXT NOT NULL DEFAULT \'\'', "Problem.sponsorName");
  await run('ALTER TABLE "Problem" ADD COLUMN "orgId" TEXT', "Problem.orgId");

  // Organization table
  await run(`CREATE TABLE IF NOT EXISTS "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "tier" TEXT NOT NULL DEFAULT 'free',
    "logo" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`, "Organization table");
  await run('CREATE UNIQUE INDEX IF NOT EXISTS "Organization_slug_key" ON "Organization"("slug")', "Organization slug index");

  // OrgMember table
  await run(`CREATE TABLE IF NOT EXISTS "OrgMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    CONSTRAINT "OrgMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrgMember_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`, "OrgMember table");
  await run('CREATE UNIQUE INDEX IF NOT EXISTS "OrgMember_userId_orgId_key" ON "OrgMember"("userId", "orgId")', "OrgMember unique index");

  // BountySubmission table
  await run(`CREATE TABLE IF NOT EXISTS "BountySubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "problemId" TEXT NOT NULL,
    "submitterId" TEXT NOT NULL,
    CONSTRAINT "BountySubmission_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BountySubmission_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`, "BountySubmission table");

  // Seed sample bounty problems
  const founder = await client.execute("SELECT id FROM User WHERE email = 'founder@collabra.io'");
  if (founder.rows.length > 0) {
    const founderId = founder.rows[0].id as string;

    // Create a sample org
    const orgId = randomUUID();
    try {
      await client.execute({
        sql: 'INSERT INTO Organization (id, name, slug, description, tier, website) VALUES (?, ?, ?, ?, ?, ?)',
        args: [orgId, "AfriHealth Foundation", "afrihealth", "Improving healthcare access across Africa through technology", "team", "https://afrihealth.example.org"],
      });
      console.log("\nCreated sample org: AfriHealth Foundation");

      await client.execute({
        sql: 'INSERT INTO OrgMember (id, role, userId, orgId) VALUES (?, ?, ?, ?)',
        args: [randomUUID(), "admin", founderId, orgId],
      });

      // Create bounty problems
      const bounties = [
        {
          title: "Build a Vaccination Tracking System",
          description: "Design and build a mobile-friendly system to track vaccination schedules and coverage across rural communities. Must work offline and support SMS notifications for appointment reminders.",
          category: "health",
          bountyAmount: 5000,
          sponsorName: "AfriHealth Foundation",
        },
        {
          title: "Create a Water Quality Monitoring Dashboard",
          description: "Build a real-time dashboard that collects and visualizes water quality data from IoT sensors deployed in rural water sources. Alert communities when contamination levels are unsafe.",
          category: "environment",
          bountyAmount: 3500,
          sponsorName: "CleanWater Initiative",
        },
        {
          title: "Design a Digital Literacy Curriculum Platform",
          description: "Create an open-source platform for delivering interactive digital literacy courses to underserved youth. Must support multiple languages and work on low-end Android devices.",
          category: "education",
          bountyAmount: 2500,
          sponsorName: "EduForAll",
        },
      ];

      for (const b of bounties) {
        const existing = await client.execute({ sql: "SELECT id FROM Problem WHERE title = ?", args: [b.title] });
        if (existing.rows.length > 0) { console.log("Bounty exists:", b.title); continue; }

        await client.execute({
          sql: 'INSERT INTO Problem (id, title, description, category, status, bountyAmount, bountyStatus, sponsorName, creatorId, orgId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          args: [randomUUID(), b.title, b.description, b.category, "open", b.bountyAmount, "open", b.sponsorName, founderId, orgId],
        });
        console.log("Created bounty:", b.title, "($" + b.bountyAmount + ")");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("UNIQUE constraint")) console.log("Sample data already exists");
      else console.error("Seed error:", msg);
    }

    // Update founder with skills
    await client.execute({
      sql: "UPDATE User SET skills = ? WHERE id = ?",
      args: ["Full-Stack Development, System Design, Project Management, Data Analysis", founderId],
    });
    console.log("Updated founder skills");
  }

  console.log("\nDone!");
}

main().catch(console.error);
