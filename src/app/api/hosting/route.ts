import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Get hosting dashboard data for the current user's solutions
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  // Get all projects where user is a team member that have listings
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { projectId: true },
  });

  const projectIds = memberships.map((m) => m.projectId);

  const listings = await prisma.solutionListing.findMany({
    where: { projectId: { in: projectIds } },
    include: {
      project: {
        include: {
          problem: { select: { title: true, category: true, creator: { select: { name: true } } } },
          teamMembers: { include: { user: { select: { id: true, name: true } } } },
        },
      },
      licenses: true,
    },
  });

  // Also get all listings for admin overview
  const allListings = await prisma.solutionListing.findMany({
    include: {
      project: { select: { name: true } },
      licenses: { select: { id: true, status: true, instanceStatus: true } },
    },
  });

  const platformStats = {
    totalSolutions: allListings.length,
    runningSolutions: allListings.filter((l) => l.hostingStatus === "running").length,
    totalInstances: allListings.reduce((s, l) => s + l.licenses.length, 0),
    activeInstances: allListings.reduce((s, l) => s + l.licenses.filter((li) => li.instanceStatus === "running").length, 0),
    totalRevenue: allListings.reduce((s, l) => s + l.totalRevenue, 0),
    platformRevenue: allListings.reduce((s, l) => s + Math.round(l.totalRevenue * l.platformSplit / 100), 0),
  };

  return Response.json({ listings, platformStats });
}

// Deploy or update a solution's hosting
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { listingId, action, hostingTier, hostingRegion, setupDocs, techStack } = await request.json();

  const listing = await prisma.solutionListing.findUnique({
    where: { id: listingId },
    include: { project: { include: { teamMembers: true } } },
  });

  if (!listing) return Response.json({ error: "Listing not found" }, { status: 404 });

  const isMember = listing.project.teamMembers.some((tm) => tm.userId === userId);
  if (!isMember) return Response.json({ error: "Not authorized" }, { status: 403 });

  if (action === "deploy") {
    const slug = listing.project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").substring(0, 30);
    const updated = await prisma.solutionListing.update({
      where: { id: listingId },
      data: {
        hostingStatus: "running",
        hostingUrl: `https://${slug}.collabra.app`,
        hostingTier: hostingTier || "starter",
        hostingRegion: hostingRegion || "us-east-1",
        setupDocs: setupDocs || "",
        techStack: techStack || "",
      },
    });
    return Response.json(updated);
  }

  if (action === "stop") {
    const updated = await prisma.solutionListing.update({
      where: { id: listingId },
      data: { hostingStatus: "stopped" },
    });
    return Response.json(updated);
  }

  if (action === "restart") {
    const updated = await prisma.solutionListing.update({
      where: { id: listingId },
      data: { hostingStatus: "running" },
    });
    return Response.json(updated);
  }

  if (action === "update_config") {
    const updated = await prisma.solutionListing.update({
      where: { id: listingId },
      data: {
        ...(hostingTier && { hostingTier }),
        ...(hostingRegion && { hostingRegion }),
        ...(setupDocs !== undefined && { setupDocs }),
        ...(techStack !== undefined && { techStack }),
      },
    });
    return Response.json(updated);
  }

  if (action === "provision_instance") {
    const { licenseId } = await request.json();
    const license = await prisma.solutionLicense.findUnique({ where: { id: licenseId } });
    if (!license) return Response.json({ error: "License not found" }, { status: 404 });

    const slug = license.id.substring(0, 8);
    const updated = await prisma.solutionLicense.update({
      where: { id: licenseId },
      data: {
        instanceUrl: `${listing.hostingUrl}/${slug}`,
        instanceStatus: "running",
        accessKey: `ck_live_${slug}_${Date.now().toString(36)}`,
        status: "active",
      },
    });
    return Response.json(updated);
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
