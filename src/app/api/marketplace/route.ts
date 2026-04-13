import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Get all published solution listings
export async function GET() {
  const listings = await prisma.solutionListing.findMany({
    where: { published: true },
    include: {
      project: {
        include: {
          problem: { include: { creator: { select: { id: true, name: true } } } },
          teamMembers: {
            include: { user: { select: { id: true, name: true, points: true } } },
          },
          tasks: { where: { status: "done" }, select: { id: true } },
          milestones: { where: { completed: true }, select: { id: true } },
        },
      },
      licenses: {
        select: { id: true, orgName: true, status: true },
      },
    },
    orderBy: { totalRevenue: "desc" },
  });

  return Response.json(listings);
}

// Publish a solution listing (team members only)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { projectId, priceMonthly, tagline, features } = await request.json();

  if (!projectId || !priceMonthly) {
    return Response.json({ error: "Project and price required" }, { status: 400 });
  }

  // Verify team membership
  const membership = await prisma.teamMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (!membership) {
    return Response.json({ error: "Only team members can list solutions" }, { status: 403 });
  }

  // Verify project is completed
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.status !== "completed") {
    return Response.json({ error: "Only completed projects can be listed" }, { status: 400 });
  }

  const listing = await prisma.solutionListing.upsert({
    where: { projectId },
    update: {
      priceMonthly: parseInt(priceMonthly),
      tagline: tagline || "",
      features: features || "",
      published: true,
    },
    create: {
      projectId,
      priceMonthly: parseInt(priceMonthly),
      tagline: tagline || "",
      features: features || "",
      published: true,
    },
  });

  return Response.json(listing);
}
