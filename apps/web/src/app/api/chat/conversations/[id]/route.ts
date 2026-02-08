import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import {
  getAuthenticatedUser,
  unauthorized,
  notFound,
  success,
  serverError,
} from "@/lib/api-auth";
import { forbidden } from "@/lib/rbac";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id } = await params;

    const conversation = await prisma.chatConversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) return notFound("Conversation");
    if (conversation.userId !== user.id) return forbidden("Not your conversation");

    return success(conversation);
  } catch (error) {
    console.error("Get conversation error:", error);
    return serverError();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const body = await request.json();

    const conversation = await prisma.chatConversation.findUnique({ where: { id } });
    if (!conversation) return notFound("Conversation");
    if (conversation.userId !== user.id) return forbidden("Not your conversation");

    const updated = await prisma.chatConversation.update({
      where: { id },
      data: { title: body.title },
    });

    return success(updated);
  } catch (error) {
    console.error("Update conversation error:", error);
    return serverError("Failed to update conversation");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id } = await params;

    const conversation = await prisma.chatConversation.findUnique({ where: { id } });
    if (!conversation) return notFound("Conversation");
    if (conversation.userId !== user.id) return forbidden("Not your conversation");

    await prisma.chatConversation.delete({ where: { id } });

    return success({ deleted: true });
  } catch (error) {
    console.error("Delete conversation error:", error);
    return serverError("Failed to delete conversation");
  }
}
