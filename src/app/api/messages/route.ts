import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Get conversations (grouped by the other user)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: {
      sender: { select: { id: true, name: true, points: true } },
      receiver: { select: { id: true, name: true, points: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by conversation partner
  const conversations = new Map<string, {
    partnerId: string;
    partnerName: string;
    partnerPoints: number;
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
    projectName: string | null;
  }>();

  for (const msg of messages) {
    const isMe = msg.senderId === userId;
    const partner = isMe ? msg.receiver : msg.sender;

    if (!conversations.has(partner.id)) {
      conversations.set(partner.id, {
        partnerId: partner.id,
        partnerName: partner.name,
        partnerPoints: partner.points,
        lastMessage: msg.content,
        lastMessageAt: msg.createdAt.toISOString(),
        unreadCount: !isMe && !msg.read ? 1 : 0,
        projectName: msg.project?.name || null,
      });
    } else {
      const conv = conversations.get(partner.id)!;
      if (!isMe && !msg.read) conv.unreadCount++;
    }
  }

  return Response.json(Array.from(conversations.values()));
}

// Send a message
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { receiverId, content, projectId } = await request.json();

  if (!receiverId || !content?.trim()) {
    return Response.json({ error: "Receiver and content required" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      content: content.trim(),
      senderId: userId,
      receiverId,
      ...(projectId && { projectId }),
    },
    include: {
      sender: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
    },
  });

  return Response.json(message);
}
