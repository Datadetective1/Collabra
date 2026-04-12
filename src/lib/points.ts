import { prisma } from "@/lib/db";

export const POINT_VALUES = {
  join_project: 5,
  complete_task: 10,
  complete_milestone: 30,
  complete_project: 100,
} as const;

export type PointAction = keyof typeof POINT_VALUES;

export function getReputationLevel(points: number): string {
  if (points >= 500) return "Master Collaborator";
  if (points >= 250) return "Impact Leader";
  if (points >= 100) return "Problem Solver";
  if (points >= 30) return "Builder";
  return "Contributor";
}

export async function awardPoints(userId: string, action: PointAction) {
  const points = POINT_VALUES[action];

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { points: { increment: points } },
    }),
    prisma.pointLog.create({
      data: { userId, action, points },
    }),
  ]);

  return points;
}
