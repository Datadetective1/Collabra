import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const users = await prisma.user.findMany({
    where: { available: true, points: { gt: 0 } },
    select: {
      id: true,
      name: true,
      bio: true,
      skills: true,
      points: true,
      available: true,
      createdAt: true,
      teamMemberships: {
        select: {
          project: { select: { id: true, name: true, status: true } },
        },
      },
      tasksAssigned: {
        where: { status: "done" },
        select: { id: true },
      },
    },
    orderBy: { points: "desc" },
  });

  const talent = users.map((u) => ({
    id: u.id,
    name: u.name,
    bio: u.bio,
    skills: u.skills ? u.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
    points: u.points,
    available: u.available,
    projectCount: u.teamMemberships.length,
    completedProjects: u.teamMemberships.filter((tm) => tm.project.status === "completed").length,
    tasksCompleted: u.tasksAssigned.length,
    joinedAt: u.createdAt,
  }));

  return Response.json(talent);
}
