import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const projects = await prisma.project.findMany({
    where: { status: "completed", isPublic: true },
    include: {
      problem: { include: { creator: { select: { name: true } } } },
      teamMembers: {
        include: { user: { select: { name: true, points: true } } },
      },
      tasks: true,
      milestones: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(projects);
}
