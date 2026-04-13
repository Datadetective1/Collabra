import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });
import { createClient } from "@libsql/client";

const client = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });

async function run(sql: string, label: string) {
  try { await client.execute(sql); console.log("OK:", label); }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("duplicate column") || msg.includes("already exists")) console.log("Exists:", label);
    else console.error("Error:", label, msg);
  }
}

async function main() {
  console.log("Adding hosting fields to Turso...\n");

  // SolutionListing hosting fields
  await run("ALTER TABLE SolutionListing ADD COLUMN hostingStatus TEXT NOT NULL DEFAULT 'pending'", "hostingStatus");
  await run("ALTER TABLE SolutionListing ADD COLUMN hostingUrl TEXT NOT NULL DEFAULT ''", "hostingUrl");
  await run("ALTER TABLE SolutionListing ADD COLUMN hostingRegion TEXT NOT NULL DEFAULT 'us-east-1'", "hostingRegion");
  await run("ALTER TABLE SolutionListing ADD COLUMN hostingTier TEXT NOT NULL DEFAULT 'starter'", "hostingTier");
  await run("ALTER TABLE SolutionListing ADD COLUMN setupDocs TEXT NOT NULL DEFAULT ''", "setupDocs");
  await run("ALTER TABLE SolutionListing ADD COLUMN techStack TEXT NOT NULL DEFAULT ''", "techStack");

  // SolutionLicense instance fields
  await run("ALTER TABLE SolutionLicense ADD COLUMN instanceUrl TEXT NOT NULL DEFAULT ''", "instanceUrl");
  await run("ALTER TABLE SolutionLicense ADD COLUMN instanceStatus TEXT NOT NULL DEFAULT 'provisioning'", "instanceStatus");
  await run("ALTER TABLE SolutionLicense ADD COLUMN accessKey TEXT NOT NULL DEFAULT ''", "accessKey");
  await run("ALTER TABLE SolutionLicense ADD COLUMN dataRegion TEXT NOT NULL DEFAULT 'us-east-1'", "dataRegion");
  await run("ALTER TABLE SolutionLicense ADD COLUMN storageUsed INTEGER NOT NULL DEFAULT 0", "storageUsed");
  await run("ALTER TABLE SolutionLicense ADD COLUMN monthlyUsage INTEGER NOT NULL DEFAULT 0", "monthlyUsage");

  // Update existing listings with hosting data
  const listings = await client.execute("SELECT id, projectId FROM SolutionListing");
  const hostingData = [
    { hostingUrl: "https://health-dashboard.collabra.app", techStack: "Next.js,PostgreSQL,Redis", hostingStatus: "running" },
    { hostingUrl: "https://farm-tracker.collabra.app", techStack: "React Native,SQLite,Node.js", hostingStatus: "running" },
    { hostingUrl: "https://skillswap.collabra.app", techStack: "Next.js,MongoDB,Stripe", hostingStatus: "running" },
  ];

  for (let i = 0; i < listings.rows.length && i < hostingData.length; i++) {
    const d = hostingData[i];
    await client.execute({
      sql: "UPDATE SolutionListing SET hostingUrl = ?, techStack = ?, hostingStatus = ?, hostingTier = 'growth' WHERE id = ?",
      args: [d.hostingUrl, d.techStack, d.hostingStatus, listings.rows[i].id as string],
    });
  }

  // Update existing licenses with instance data
  const licenses = await client.execute("SELECT id, listingId FROM SolutionLicense");
  for (const lic of licenses.rows) {
    const listing = await client.execute({ sql: "SELECT hostingUrl FROM SolutionListing WHERE id = ?", args: [lic.listingId as string] });
    const baseUrl = listing.rows[0]?.hostingUrl as string || "";
    const slug = (lic.id as string).substring(0, 8);
    await client.execute({
      sql: "UPDATE SolutionLicense SET instanceUrl = ?, instanceStatus = 'running', accessKey = ?, storageUsed = ?, monthlyUsage = ?, status = 'active' WHERE id = ?",
      args: [`${baseUrl}/${slug}`, `ck_live_${slug}_${Date.now().toString(36)}`, Math.floor(Math.random() * 500) + 50, Math.floor(Math.random() * 2000) + 200, lic.id as string],
    });
  }

  console.log("\nUpdated", listings.rows.length, "listings and", licenses.rows.length, "licenses with hosting data");
  console.log("Done!");
}

main().catch(console.error);
