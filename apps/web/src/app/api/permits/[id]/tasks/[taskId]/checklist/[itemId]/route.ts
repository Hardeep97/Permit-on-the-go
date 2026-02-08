import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import {
  getAuthenticatedUser,
  unauthorized,
  badRequest,
  notFound,
  success,
  serverError,
} from "@/lib/api-auth";
import { checkPermitAccess, forbidden } from "@/lib/rbac";
import { updateChecklistItemSchema } from "@permits/shared";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string; itemId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id, taskId, itemId } = await params;
    const access = await checkPermitAccess(id, user.id);
    if (!access) return forbidden("You don't have access to this permit");
    if (
      !access.permissions.includes("edit") &&
      !access.permissions.includes("complete_tasks")
    ) {
      return forbidden("You don't have permission to update checklist items");
    }

    // Verify task belongs to this permit and item belongs to task
    const task = await prisma.task.findFirst({
      where: { id: taskId, permitId: id },
      select: { id: true },
    });

    if (!task) {
      return badRequest("Task not found or does not belong to this permit");
    }

    const currentItem = await prisma.taskChecklistItem.findFirst({
      where: { id: itemId, taskId },
    });

    if (!currentItem) {
      return notFound("Checklist item");
    }

    const body = await request.json();
    const parsed = updateChecklistItemSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0]?.message || "Invalid checklist item data");
    }

    const updates = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.isCompleted !== undefined) updateData.isCompleted = updates.isCompleted;

    const item = await prisma.taskChecklistItem.update({
      where: { id: itemId },
      data: updateData,
    });

    return success(item);
  } catch (error) {
    console.error("Update checklist item error:", error);
    return serverError("Failed to update checklist item");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string; itemId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id, taskId, itemId } = await params;
    const access = await checkPermitAccess(id, user.id);
    if (!access) return forbidden("You don't have access to this permit");
    if (!access.permissions.includes("edit")) {
      return forbidden("You don't have permission to delete checklist items");
    }

    // Verify task belongs to this permit and item belongs to task
    const task = await prisma.task.findFirst({
      where: { id: taskId, permitId: id },
      select: { id: true },
    });

    if (!task) {
      return badRequest("Task not found or does not belong to this permit");
    }

    const item = await prisma.taskChecklistItem.findFirst({
      where: { id: itemId, taskId },
    });

    if (!item) {
      return notFound("Checklist item");
    }

    await prisma.taskChecklistItem.delete({
      where: { id: itemId },
    });

    return success({ message: "Checklist item deleted successfully" });
  } catch (error) {
    console.error("Delete checklist item error:", error);
    return serverError("Failed to delete checklist item");
  }
}
