import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });

import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  const updates = [
    {
      match: "Community Health Dashboard%",
      description: "Designed and prototyped a lightweight dashboard for rural health workers to track patient trends, monitor medicine stock, and receive outbreak alerts. Built with offline-first architecture for low-bandwidth environments. Ready for pilot testing with partner clinics.",
    },
    {
      match: "Micro-Farm Yield Tracker%",
      description: "Built a mobile-first Progressive Web App that helps smallholder farmers log crop yields, record soil conditions, and view weather forecasts. Features offline data storage with automatic sync. Currently being tested with farming cooperatives in East Africa.",
    },
    {
      match: "Skill-Swap Marketplace for%",
      description: "Developed a peer-to-peer platform where young people in underserved communities can list their skills, find matches, and build verifiable portfolios. Includes a reputation system and review mechanism. Preparing for community launch in three cities.",
    },
  ];

  for (const u of updates) {
    const result = await client.execute({
      sql: "UPDATE Project SET demoUrl = '', repoUrl = '', description = ? WHERE name LIKE ?",
      args: [u.description, u.match],
    });
    console.log("Updated:", u.match, "- rows:", result.rowsAffected);
  }

  // Verify
  const projects = await client.execute("SELECT name, demoUrl, repoUrl, description FROM Project WHERE status = 'completed'");
  for (const row of projects.rows) {
    console.log("\n" + row.name);
    console.log("  demo:", row.demoUrl || "(none)");
    console.log("  repo:", row.repoUrl || "(none)");
    console.log("  desc:", (row.description as string).substring(0, 80) + "...");
  }
}

main().catch(console.error);
