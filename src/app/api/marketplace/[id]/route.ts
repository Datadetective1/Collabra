import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Get a single listing detail
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const listing = await prisma.solutionListing.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          problem: { include: { creator: { select: { id: true, name: true } } } },
          teamMembers: {
            include: { user: { select: { id: true, name: true, points: true } } },
          },
          tasks: true,
          milestones: true,
        },
      },
      licenses: {
        select: { id: true, orgName: true, status: true, createdAt: true },
      },
    },
  });

  if (!listing) {
    return Response.json({ error: "Listing not found" }, { status: 404 });
  }

  return Response.json(listing);
}

// Request a license (anyone can request)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, email, orgName } = await request.json();

  if (!name || !email) {
    return Response.json({ error: "Name and email required" }, { status: 400 });
  }

  const listing = await prisma.solutionListing.findUnique({ where: { id } });
  if (!listing) {
    return Response.json({ error: "Listing not found" }, { status: 404 });
  }

  const license = await prisma.solutionLicense.create({
    data: {
      licensee: name,
      email,
      orgName: orgName || "",
      listingId: id,
    },
  });

  // Update total revenue
  await prisma.solutionListing.update({
    where: { id },
    data: { totalRevenue: { increment: listing.priceMonthly } },
  });

  return Response.json({
    message: "License requested! You'll receive setup instructions at " + email,
    license,
  });
}
