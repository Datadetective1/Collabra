import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { awardPoints } from "@/lib/points";

// Create a project from a problem
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { problemId, name } = body;
  const userId = (session.user as { id: string }).id;

  // Check problem exists and has no project
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: { project: true },
  });

  if (!problem) {
    return Response.json({ error: "Problem not found" }, { status: 404 });
  }
  if (problem.project) {
    return Response.json({ error: "Project already exists for this problem" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name: name || problem.title,
      problemId,
      teamMembers: {
        create: { userId, role: "lead" },
      },
    },
    include: { teamMembers: true },
  });

  // Update problem status
  await prisma.problem.update({
    where: { id: problemId },
    data: { status: "in_progress" },
  });

  // Award points for joining project
  await awardPoints(userId, "join_project");

  return Response.json(project);
}

export async function GET() {
  const projects = await prisma.project.findMany({
    where: { isPublic: true },
    include: {
      problem: true,
      teamMembers: {
        include: { user: { select: { id: true, name: true, points: true } } },
      },
      tasks: true,
      milestones: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(projects);
}
