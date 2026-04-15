import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });

import { createClient } from "@libsql/client";

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
    if (
      msg.includes("already exists") ||
      msg.includes("duplicate column")
    ) {
      console.log("Already exists, skipping:", label);
    } else {
      console.error("Error on", label, ":", msg);
      throw e;
    }
  }
}

async function main() {
  console.log("Applying magic-link migration to Turso...\n");

  // 1. Create the pending submissions table.
  await run(
    `CREATE TABLE IF NOT EXISTS "PendingProblemSubmission" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "category" TEXT NOT NULL DEFAULT 'education',
      "token" TEXT NOT NULL,
      "expiresAt" DATETIME NOT NULL,
      "consumedAt" DATETIME,
      "resultProblemId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    "CREATE TABLE PendingProblemSubmission"
  );

  // 2. Unique index on token.
  await run(
    `CREATE UNIQUE INDEX IF NOT EXISTS "PendingProblemSubmission_token_key" ON "PendingProblemSubmission"("token")`,
    "UNIQUE INDEX token"
  );

  // 3. Lookup indexes.
  await run(
    `CREATE INDEX IF NOT EXISTS "PendingProblemSubmission_email_idx" ON "PendingProblemSubmission"("email")`,
    "INDEX email"
  );
  await run(
    `CREATE INDEX IF NOT EXISTS "PendingProblemSubmission_expiresAt_idx" ON "PendingProblemSubmission"("expiresAt")`,
    "INDEX expiresAt"
  );

  // NOTE: We intentionally do NOT alter User.passwordHash to be nullable on
  // Turso — rebuilding the User table under all its foreign keys is risky.
  // Instead, the magic-link auth provider writes a random unusable bcrypt
  // hash for passwordless users. Password sign-in for those accounts just
  // silently fails (bcrypt.compare will never match), which is the desired
  // behavior.

  console.log("\nDone! Magic-link schema applied to Turso.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
