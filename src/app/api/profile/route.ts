import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      points: true,
      bio: true,
      createdAt: true,
      teamMemberships: {
        include: {
          project: {
            include: { problem: true },
          },
        },
      },
      pointLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  return Response.json(user);
}
