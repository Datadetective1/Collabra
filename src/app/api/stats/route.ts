import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const [problems, projects, builders, solved] = await Promise.all([
    prisma.problem.count(),
    prisma.project.count(),
    prisma.user.count(),
    prisma.project.count({ where: { status: "completed" } }),
  ]);

  return Response.json({
    problemsPosted: problems,
    projectsStarted: projects,
    buildersJoined: builders,
    solutionsShipped: solved,
  });
}
