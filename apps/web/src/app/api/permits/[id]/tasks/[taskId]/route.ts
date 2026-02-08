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
import { logActivity, ACTIONS } from "@/lib/activity";
import { sendNotification } from "@/lib/notifications";
import { updateTaskSchema } from "@permits/shared";

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

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        permitId: id,
      },
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
    });

    if (!task) return notFound("Task");

    return success(task);
  } catch (error) {
    console.error("Get task error:", error);
    return serverError();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id, taskId } = await params;
    const access = await checkPermitAccess(id, user.id);
    if (!access) return forbidden("You don't have access to this permit");

    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0]?.message || "Invalid task data");
    }

    // Get current task to check permissions and changes
    const currentTask = await prisma.task.findFirst({
      where: { id: taskId, permitId: id },
      include: {
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    if (!currentTask) return notFound("Task");

    const updates = parsed.data;

    // Check permissions based on what's being updated
    if (updates.status === "COMPLETED") {
      if (!access.permissions.includes("complete_tasks")) {
        return forbidden("You don't have permission to complete tasks");
      }
      // Set completedAt when marking as completed
      updates.completedAt = new Date().toISOString();
    }

    if (updates.assigneeId !== undefined && updates.assigneeId !== currentTask.assigneeId) {
      if (!access.permissions.includes("assign_tasks")) {
        return forbidden("You don't have permission to assign tasks");
      }
    }

    // For all other changes, need edit permission
    if (!access.permissions.includes("edit")) {
      // Unless only completing a task assigned to them
      if (
        !(
          updates.status === "COMPLETED" &&
          currentTask.assigneeId === user.id &&
          Object.keys(updates).length === 2 // status and completedAt
        )
      ) {
        return forbidden("You don't have permission to edit this task");
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.dueDate !== undefined) {
      updateData.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
    }
    if (updates.assigneeId !== undefined) updateData.assigneeId = updates.assigneeId;
    if (updates.completedAt !== undefined) {
      updateData.completedAt = updates.completedAt ? new Date(updates.completedAt) : null;
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
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
    });

    // Log activity and send notifications based on changes
    if (updates.status === "COMPLETED" && currentTask.status !== "COMPLETED") {
      await logActivity({
        userId: user.id,
        action: ACTIONS.TASK_COMPLETED,
        entityType: "TASK",
        entityId: task.id,
        description: `Completed task: ${task.title}`,
        permitId: id,
      });

      // Notify creator if different from user
      if (currentTask.creatorId && currentTask.creatorId !== user.id) {
        await sendNotification({
          userId: currentTask.creatorId,
          title: "Task Completed",
          body: `${user.name} completed the task: ${task.title}`,
          type: "TASK_COMPLETED",
          entityType: "TASK",
          entityId: task.id,
          permitId: id,
          actionUrl: `/dashboard/permits/${id}/tasks/${task.id}`,
        });
      }
    }

    if (updates.assigneeId !== undefined && updates.assigneeId !== currentTask.assigneeId) {
      await logActivity({
        userId: user.id,
        action: ACTIONS.TASK_ASSIGNED,
        entityType: "TASK",
        entityId: task.id,
        description: updates.assigneeId
          ? `Assigned task "${task.title}" to ${task.assignee?.name || "user"}`
          : `Unassigned task "${task.title}"`,
        permitId: id,
        metadata: { assigneeId: updates.assigneeId, previousAssigneeId: currentTask.assigneeId },
      });

      // Notify new assignee
      if (updates.assigneeId && updates.assigneeId !== user.id) {
        await sendNotification({
          userId: updates.assigneeId,
          title: "Task Assigned",
          body: `${user.name} assigned you a task: ${task.title}`,
          type: "TASK_ASSIGNED",
          entityType: "TASK",
          entityId: task.id,
          permitId: id,
          actionUrl: `/dashboard/permits/${id}/tasks/${task.id}`,
        });
      }
    }

    return success(task);
  } catch (error) {
    console.error("Update task error:", error);
    return serverError("Failed to update task");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id, taskId } = await params;
    const access = await checkPermitAccess(id, user.id);
    if (!access) return forbidden("You don't have access to this permit");

    const task = await prisma.task.findFirst({
      where: { id: taskId, permitId: id },
      select: { creatorId: true, title: true },
    });

    if (!task) return notFound("Task");

    // Only creator or OWNER/EXPEDITOR can delete
    if (task.creatorId !== user.id && !["OWNER", "EXPEDITOR"].includes(access.role)) {
      return forbidden("Only the task creator or permit owner/expeditor can delete tasks");
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    await logActivity({
      userId: user.id,
      action: ACTIONS.DELETED,
      entityType: "TASK",
      entityId: taskId,
      description: `Deleted task: ${task.title}`,
      permitId: id,
    });

    return success({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    return serverError("Failed to delete task");
  }
}
