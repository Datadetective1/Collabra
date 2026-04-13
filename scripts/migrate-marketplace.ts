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
  console.log("Adding marketplace tables to Turso...\n");

  await run(`CREATE TABLE IF NOT EXISTS "SolutionListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "published" INTEGER NOT NULL DEFAULT 0,
    "priceMonthly" INTEGER NOT NULL DEFAULT 0,
    "tagline" TEXT NOT NULL DEFAULT '',
    "features" TEXT NOT NULL DEFAULT '',
    "builderSplit" INTEGER NOT NULL DEFAULT 70,
    "platformSplit" INTEGER NOT NULL DEFAULT 20,
    "creatorSplit" INTEGER NOT NULL DEFAULT 10,
    "totalRevenue" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "SolutionListing_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`, "SolutionListing table");
  await run('CREATE UNIQUE INDEX IF NOT EXISTS "SolutionListing_projectId_key" ON "SolutionListing"("projectId")', "SolutionListing index");

  await run(`CREATE TABLE IF NOT EXISTS "SolutionLicense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'active',
    "licensee" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "orgName" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listingId" TEXT NOT NULL,
    CONSTRAINT "SolutionLicense_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "SolutionListing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`, "SolutionLicense table");

  // Seed marketplace listings for the 3 completed projects
  const projects = await client.execute("SELECT id, name, description FROM Project WHERE status = 'completed'");

  const listingData: Record<string, { price: number; tagline: string; features: string }> = {
    "Community Health Dashboard": {
      price: 50,
      tagline: "Track patient trends, medicine stock, and outbreak alerts in real-time",
      features: "Patient trend analytics,Medicine inventory tracking,Outbreak alert system,Low-bandwidth optimized,Multi-clinic support,SMS notifications",
    },
    "Micro-Farm Yield Tracker": {
      price: 35,
      tagline: "Log yields, track soil conditions, and access weather forecasts offline",
      features: "Crop yield logging,Soil condition tracking,Weather forecasts,Offline-first design,Auto-sync when connected,Multi-farm support",
    },
    "Skill-Swap Marketplace": {
      price: 45,
      tagline: "Connect youth to exchange skills and build verifiable portfolios",
      features: "Skill listing and matching,Portfolio builder,Reputation system,Peer reviews,Multi-language support,Community management",
    },
  };

  for (const project of projects.rows) {
    const name = project.name as string;
    const matchKey = Object.keys(listingData).find((k) => name.startsWith(k));
    if (!matchKey) continue;

    const data = listingData[matchKey];
    const listingId = randomUUID();

    // Check if listing already exists
    const existing = await client.execute({
      sql: "SELECT id FROM SolutionListing WHERE projectId = ?",
      args: [project.id as string],
    });
    if (existing.rows.length > 0) {
      console.log("Listing exists for:", name);
      continue;
    }

    await client.execute({
      sql: 'INSERT INTO SolutionListing (id, published, priceMonthly, tagline, features, builderSplit, platformSplit, creatorSplit, totalRevenue, projectId) VALUES (?, 1, ?, ?, ?, 70, 20, 10, 0, ?)',
      args: [listingId, data.price, data.tagline, data.features, project.id as string],
    });
    console.log("Created listing:", name, "($" + data.price + "/mo)");

    // Add a couple of sample licenses to show activity
    const sampleLicensees = [
      { name: "Greenfield Academy", email: "admin@greenfield.edu", org: "Greenfield Academy" },
      { name: "Bright Future School", email: "tech@brightfuture.org", org: "Bright Future School" },
    ];

    for (const lic of sampleLicensees) {
      await client.execute({
        sql: 'INSERT INTO SolutionLicense (id, status, licensee, email, orgName, listingId) VALUES (?, ?, ?, ?, ?, ?)',
        args: [randomUUID(), "active", lic.name, lic.email, lic.org, listingId],
      });
    }

    // Update revenue (2 licensees × price × some months)
    const revenue = data.price * 2 * 3; // 2 users, 3 months
    await client.execute({
      sql: "UPDATE SolutionListing SET totalRevenue = ? WHERE id = ?",
      args: [revenue, listingId],
    });
    console.log("  Added 2 sample licenses, revenue: $" + revenue);
  }

  console.log("\nDone!");
}

main().catch(console.error);
