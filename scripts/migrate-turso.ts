import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });

import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  // Add new columns to Project table
  const columns = [
    'ALTER TABLE "Project" ADD COLUMN "demoUrl" TEXT NOT NULL DEFAULT \'\'',
    'ALTER TABLE "Project" ADD COLUMN "repoUrl" TEXT NOT NULL DEFAULT \'\'',
    'ALTER TABLE "Project" ADD COLUMN "description" TEXT NOT NULL DEFAULT \'\'',
  ];

  for (const sql of columns) {
    try {
      await client.execute(sql);
      console.log("OK:", sql.substring(0, 60));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("duplicate column")) {
        console.log("Already exists, skipping");
      } else {
        console.error("Error:", msg);
      }
    }
  }

  // Update the 3 showcase projects with solution details
  const updates = [
    {
      title: "Community Health Dashboard",
      demoUrl: "https://health-dashboard-demo.example.com",
      repoUrl: "https://github.com/collabra/community-health-dashboard",
      description: "A lightweight, mobile-first dashboard that helps rural health workers track patient trends, monitor medicine stock levels, and receive outbreak alerts — all optimized for low-bandwidth connections.",
    },
    {
      title: "Micro-Farm Yield Tracker",
      demoUrl: "https://farm-tracker-demo.example.com",
      repoUrl: "https://github.com/collabra/micro-farm-tracker",
      description: "An offline-first mobile app that helps smallholder farmers log crop yields, track soil conditions, and access weather forecasts — syncing data automatically when connectivity is available.",
    },
    {
      title: "Skill-Swap Marketplace for",
      demoUrl: "https://skillswap-demo.example.com",
      repoUrl: "https://github.com/collabra/skill-swap-marketplace",
      description: "A peer-to-peer platform connecting young people in underserved communities to exchange skills — from coding to carpentry — building verifiable portfolios and earning reputation.",
    },
  ];

  for (const u of updates) {
    const result = await client.execute({
      sql: 'UPDATE Project SET demoUrl = ?, repoUrl = ?, description = ? WHERE name LIKE ?',
      args: [u.demoUrl, u.repoUrl, u.description, u.title + "%"],
    });
    console.log("Updated", u.title, "- rows:", result.rowsAffected);
  }

  console.log("\nDone! Turso schema updated and showcase data populated.");
}

main().catch(console.error);
