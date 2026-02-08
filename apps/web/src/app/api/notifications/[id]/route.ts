import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import {
  getAuthenticatedUser,
  unauthorized,
  notFound,
  success,
  serverError,
} from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const notification = await prisma.notification.findFirst({
      where: { id, userId: user.id },
    });

    if (!notification) return notFound("Notification");

    const updated = await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });

    return success(updated);
  } catch (error) {
    console.error("Update notification error:", error);
    return serverError();
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
    const notification = await prisma.notification.findFirst({
      where: { id, userId: user.id },
    });

    if (!notification) return notFound("Notification");

    await prisma.notification.delete({ where: { id } });

    return success({ deleted: true });
  } catch (error) {
    console.error("Delete notification error:", error);
    return serverError();
  }
}
