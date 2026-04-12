import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Get all bounty problems
export async function GET() {
  const problems = await prisma.problem.findMany({
    where: { bountyAmount: { gt: 0 } },
    include: {
      creator: { select: { name: true } },
      project: { select: { id: true, status: true } },
      bountySubmissions: {
        select: { id: true, status: true, submitter: { select: { name: true } } },
      },
    },
    orderBy: { bountyAmount: "desc" },
  });

  return Response.json(problems);
}

// Create a bounty problem
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { title, description, category, bountyAmount, sponsorName } = await request.json();

  if (!title || !description || !bountyAmount) {
    return Response.json({ error: "Title, description, and bounty amount required" }, { status: 400 });
  }

  const problem = await prisma.problem.create({
    data: {
      title,
      description,
      category: category || "general",
      bountyAmount: parseInt(bountyAmount),
      bountyStatus: "open",
      sponsorName: sponsorName || "",
      creatorId: userId,
    },
  });

  return Response.json(problem);
}
