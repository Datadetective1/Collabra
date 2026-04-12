import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { awardPoints } from "@/lib/points";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      problem: { include: { creator: { select: { id: true, name: true } } } },
      teamMembers: {
        include: { user: { select: { id: true, name: true, points: true, role: true } } },
      },
      tasks: {
        include: { assignee: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      milestones: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  return Response.json(project);
}

// Join a project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as { id: string }).id;
  const body = await request.json();

  if (body.action === "join") {
    // Check if already a member
    const existing = await prisma.teamMember.findUnique({
      where: { userId_projectId: { userId, projectId: id } },
    });

    if (existing) {
      return Response.json({ error: "Already a team member" }, { status: 400 });
    }

    await prisma.teamMember.create({
      data: { userId, projectId: id, role: "member" },
    });

    await awardPoints(userId, "join_project");

    return Response.json({ message: "Joined project" });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
