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
import { logActivity, ACTIONS } from "@/lib/activity";
import { sendNotification } from "@/lib/notifications";
import { createTaskSchema } from "@permits/shared";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const access = await checkPermitAccess(id, user.id);
    if (!access) return forbidden("You don't have access to this permit");
    if (!access.permissions.includes("read")) {
      return forbidden("You don't have permission to view tasks on this permit");
    }

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const assigneeId = searchParams.get("assigneeId");

    const where: {
      permitId: string;
      status?: string;
      assigneeId?: string | null;
    } = { permitId: id };

    if (status) {
      where.status = status;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId === "unassigned" ? null : assigneeId;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        checklistItems: {
          orderBy: { sortOrder: "asc" },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return success({ tasks });
  } catch (error) {
    console.error("List tasks error:", error);
    return serverError();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const access = await checkPermitAccess(id, user.id);
    if (!access) return forbidden("You don't have access to this permit");
    if (
      !access.permissions.includes("assign_tasks") &&
      !access.permissions.includes("edit")
    ) {
      return forbidden("You don't have permission to create tasks on this permit");
    }

    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0]?.message || "Invalid task data");
    }

    const { title, description, priority, dueDate, assigneeId } = parsed.data;

    // Get the highest sortOrder for this permit
    const maxSortOrder = await prisma.task.findFirst({
      where: { permitId: id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || "NORMAL",
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId,
        permitId: id,
        creatorId: user.id,
        sortOrder: (maxSortOrder?.sortOrder || 0) + 1,
        status: "TODO",
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        checklistItems: true,
      },
    });

    // Log activity
    await logActivity({
      userId: user.id,
      action: ACTIONS.CREATED,
      entityType: "TASK",
      entityId: task.id,
      description: `Created task: ${title}`,
      permitId: id,
    });

    // If task is assigned, notify the assignee
    if (assigneeId && assigneeId !== user.id) {
      await logActivity({
        userId: user.id,
        action: ACTIONS.TASK_ASSIGNED,
        entityType: "TASK",
        entityId: task.id,
        description: `Assigned task "${title}" to ${task.assignee?.name || "user"}`,
        permitId: id,
        metadata: { assigneeId },
      });

      await sendNotification({
        userId: assigneeId,
        title: "Task Assigned",
        body: `${user.name} assigned you a task: ${title}`,
        type: "TASK_ASSIGNED",
        entityType: "TASK",
        entityId: task.id,
        permitId: id,
        actionUrl: `/dashboard/permits/${id}/tasks/${task.id}`,
      });
    }

    return success(task, 201);
  } catch (error) {
    console.error("Create task error:", error);
    return serverError("Failed to create task");
  }
}
