import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const orgs = await prisma.organization.findMany({
    include: {
      members: {
        include: { user: { select: { id: true, name: true, points: true } } },
      },
      problems: {
        select: { id: true, title: true, bountyAmount: true, bountyStatus: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(orgs);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { name, description, website } = await request.json();

  if (!name) {
    return Response.json({ error: "Organization name required" }, { status: 400 });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const existing = await prisma.organization.findUnique({ where: { slug } });
  if (existing) {
    return Response.json({ error: "An organization with this name already exists" }, { status: 400 });
  }

  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      description: description || "",
      website: website || "",
      tier: "free",
      members: {
        create: { userId, role: "admin" },
      },
    },
  });

  return Response.json(org);
}
