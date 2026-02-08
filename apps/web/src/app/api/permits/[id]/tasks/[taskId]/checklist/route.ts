import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import {
  getAuthenticatedUser,
  unauthorized,
  badRequest,
  success,
  serverError,
} from "@/lib/api-auth";
import { checkPermitAccess, forbidden } from "@/lib/rbac";
import { createChecklistItemSchema } from "@permits/shared";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id, taskId } = await params;
    const access = await checkPermitAccess(id, user.id);
    if (!access) return forbidden("You don't have access to this permit");
    if (!access.permissions.includes("read")) {
      return forbidden("You don't have permission to view tasks on this permit");
    }

    // Verify task belongs to this permit
    const task = await prisma.task.findFirst({
      where: { id: taskId, permitId: id },
      select: { id: true },
    });

    if (!task) {
      return badRequest("Task not found or does not belong to this permit");
    }

    const items = await prisma.taskChecklistItem.findMany({
      where: { taskId },
      orderBy: { sortOrder: "asc" },
    });

    return success({ items });
  } catch (error) {
    console.error("List checklist items error:", error);
    return serverError();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id, taskId } = await params;
    const access = await checkPermitAccess(id, user.id);
    if (!access) return forbidden("You don't have access to this permit");
    if (
      !access.permissions.includes("edit") &&
      !access.permissions.includes("complete_tasks")
    ) {
      return forbidden("You don't have permission to add checklist items");
    }

    // Verify task belongs to this permit
    const task = await prisma.task.findFirst({
      where: { id: taskId, permitId: id },
      select: { id: true },
    });

    if (!task) {
      return badRequest("Task not found or does not belong to this permit");
    }

    const body = await request.json();
    const parsed = createChecklistItemSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0]?.message || "Invalid checklist item data");
    }

    const { title } = parsed.data;

    // Get the highest sortOrder for this task
    const maxSortOrder = await prisma.taskChecklistItem.findFirst({
      where: { taskId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const item = await prisma.taskChecklistItem.create({
      data: {
        title,
        taskId,
        sortOrder: (maxSortOrder?.sortOrder || 0) + 1,
        isCompleted: false,
      },
    });

    return success(item, 201);
  } catch (error) {
    console.error("Create checklist item error:", error);
    return serverError("Failed to create checklist item");
  }
}
