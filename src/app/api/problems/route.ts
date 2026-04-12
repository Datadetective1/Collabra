import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const problems = await prisma.problem.findMany({
    include: {
      creator: { select: { id: true, name: true, points: true } },
      project: {
        include: {
          teamMembers: { select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(problems);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, category } = body;

  if (!title || !description) {
    return Response.json({ error: "Title and description required" }, { status: 400 });
  }

  const userId = (session.user as { id: string }).id;

  const problem = await prisma.problem.create({
    data: {
      title,
      description,
      category: category || "education",
      creatorId: userId,
    },
  });

  return Response.json(problem);
}
