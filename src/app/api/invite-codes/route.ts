import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const codes = await prisma.inviteCode.findMany({
    where: { ownerId: userId },
    select: { code: true, used: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(codes);
}
