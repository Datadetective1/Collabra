-- CreateTable
CREATE TABLE "SolutionListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "published" BOOLEAN NOT NULL DEFAULT false,
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
);

-- CreateTable
CREATE TABLE "SolutionLicense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'active',
    "licensee" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "orgName" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listingId" TEXT NOT NULL,
    CONSTRAINT "SolutionLicense_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "SolutionListing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SolutionListing_projectId_key" ON "SolutionListing"("projectId");
