-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SolutionLicense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "licensee" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "orgName" TEXT NOT NULL DEFAULT '',
    "instanceUrl" TEXT NOT NULL DEFAULT '',
    "instanceStatus" TEXT NOT NULL DEFAULT 'provisioning',
    "accessKey" TEXT NOT NULL DEFAULT '',
    "dataRegion" TEXT NOT NULL DEFAULT 'us-east-1',
    "storageUsed" INTEGER NOT NULL DEFAULT 0,
    "monthlyUsage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listingId" TEXT NOT NULL,
    CONSTRAINT "SolutionLicense_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "SolutionListing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SolutionLicense" ("createdAt", "email", "id", "licensee", "listingId", "orgName", "status") SELECT "createdAt", "email", "id", "licensee", "listingId", "orgName", "status" FROM "SolutionLicense";
DROP TABLE "SolutionLicense";
ALTER TABLE "new_SolutionLicense" RENAME TO "SolutionLicense";
CREATE TABLE "new_SolutionListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "priceMonthly" INTEGER NOT NULL DEFAULT 0,
    "tagline" TEXT NOT NULL DEFAULT '',
    "features" TEXT NOT NULL DEFAULT '',
    "builderSplit" INTEGER NOT NULL DEFAULT 70,
    "platformSplit" INTEGER NOT NULL DEFAULT 20,
    "creatorSplit" INTEGER NOT NULL DEFAULT 10,
    "totalRevenue" INTEGER NOT NULL DEFAULT 0,
    "hostingStatus" TEXT NOT NULL DEFAULT 'pending',
    "hostingUrl" TEXT NOT NULL DEFAULT '',
    "hostingRegion" TEXT NOT NULL DEFAULT 'us-east-1',
    "hostingTier" TEXT NOT NULL DEFAULT 'starter',
    "setupDocs" TEXT NOT NULL DEFAULT '',
    "techStack" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "SolutionListing_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SolutionListing" ("builderSplit", "createdAt", "creatorSplit", "features", "id", "platformSplit", "priceMonthly", "projectId", "published", "tagline", "totalRevenue") SELECT "builderSplit", "createdAt", "creatorSplit", "features", "id", "platformSplit", "priceMonthly", "projectId", "published", "tagline", "totalRevenue" FROM "SolutionListing";
DROP TABLE "SolutionListing";
ALTER TABLE "new_SolutionListing" RENAME TO "SolutionListing";
CREATE UNIQUE INDEX "SolutionListing_projectId_key" ON "SolutionListing"("projectId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
