import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { awardPoints } from "@/lib/points";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  const body = await request.json();
  const userId = (session.user as { id: string }).id;

  // Verify user is a team member
  const member = await prisma.teamMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });

  if (!member) {
    return Response.json({ error: "Not a team member" }, { status: 403 });
  }

  if (body.action === "create") {
    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description || "",
        projectId,
        assigneeId: body.assigneeId || null,
      },
    });
    return Response.json(task);
  }

  if (body.action === "update_status") {
    const task = await prisma.task.update({
      where: { id: body.taskId },
      data: { status: body.status },
    });

    // Award points when task is completed
    if (body.status === "done" && task.assigneeId) {
      await awardPoints(task.assigneeId, "complete_task");
    }

    return Response.json(task);
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
