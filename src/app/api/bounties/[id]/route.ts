import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Submit a bounty solution
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
  const { content, action } = await request.json();

  if (action === "submit") {
    if (!content?.trim()) {
      return Response.json({ error: "Submission content required" }, { status: 400 });
    }

    const submission = await prisma.bountySubmission.create({
      data: {
        content: content.trim(),
        problemId: id,
        submitterId: userId,
      },
    });

    return Response.json(submission);
  }

  if (action === "accept") {
    const { submissionId } = await request.json();

    // Verify the user is the problem creator
    const problem = await prisma.problem.findUnique({ where: { id } });
    if (!problem || problem.creatorId !== userId) {
      return Response.json({ error: "Only the problem creator can accept submissions" }, { status: 403 });
    }

    await prisma.bountySubmission.update({
      where: { id: submissionId },
      data: { status: "accepted" },
    });

    await prisma.problem.update({
      where: { id },
      data: { bountyStatus: "awarded", status: "solved" },
    });

    return Response.json({ message: "Bounty awarded" });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
