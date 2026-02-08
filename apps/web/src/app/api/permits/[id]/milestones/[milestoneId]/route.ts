import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import {
  getAuthenticatedUser,
  unauthorized,
  notFound,
  success,
  badRequest,
  serverError,
} from "@/lib/api-auth";
import { logActivity, ACTIONS } from "@/lib/activity";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id, milestoneId } = await params;
    const body = await request.json();

    const milestone = await prisma.permitMilestone.findFirst({
      where: { id: milestoneId, permitId: id },
    });
    if (!milestone) return notFound("Milestone");

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;

    // Handle completion
    if (body.status === "COMPLETED" && milestone.status !== "COMPLETED") {
      updateData.status = "COMPLETED";
      updateData.completedAt = new Date();

      await logActivity({
        userId: user.id,
        action: ACTIONS.MILESTONE_COMPLETED,
        entityType: "MILESTONE",
        entityId: milestoneId,
        description: `Completed milestone "${milestone.title}"`,
        permitId: id,
      });
    } else if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status !== "COMPLETED") updateData.completedAt = null;
    }

    const updated = await prisma.permitMilestone.update({
      where: { id: milestoneId },
      data: updateData,
    });

    return success(updated);
  } catch (error) {
    console.error("Update milestone error:", error);
    return serverError("Failed to update milestone");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id, milestoneId } = await params;
    const milestone = await prisma.permitMilestone.findFirst({
      where: { id: milestoneId, permitId: id },
    });
    if (!milestone) return notFound("Milestone");

    await prisma.permitMilestone.delete({ where: { id: milestoneId } });

    return success({ deleted: true });
  } catch (error) {
    console.error("Delete milestone error:", error);
    return serverError("Failed to delete milestone");
  }
}
