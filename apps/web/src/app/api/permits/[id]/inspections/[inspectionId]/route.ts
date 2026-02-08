import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import {
  getAuthenticatedUser,
  unauthorized,
  notFound,
  success,
  serverError,
} from "@/lib/api-auth";
import { logActivity, ACTIONS } from "@/lib/activity";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inspectionId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id, inspectionId } = await params;
    const body = await request.json();

    const inspection = await prisma.inspection.findFirst({
      where: { id: inspectionId, permitId: id },
    });
    if (!inspection) return notFound("Inspection");

    const updateData: Record<string, unknown> = {};
    if (body.type !== undefined) updateData.type = body.type;
    if (body.scheduledDate !== undefined) {
      updateData.scheduledDate = body.scheduledDate ? new Date(body.scheduledDate) : null;
      if (body.scheduledDate) updateData.status = "SCHEDULED";
    }
    if (body.inspectorName !== undefined) updateData.inspectorName = body.inspectorName;
    if (body.inspectorPhone !== undefined) updateData.inspectorPhone = body.inspectorPhone;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.result !== undefined) updateData.result = body.result;

    // Handle pass/fail
    if (body.status === "PASSED" || body.status === "FAILED") {
      updateData.status = body.status;
      updateData.completedDate = new Date();

      await logActivity({
        userId: user.id,
        action: ACTIONS.INSPECTION_COMPLETED,
        entityType: "INSPECTION",
        entityId: inspectionId,
        description: `${inspection.type} inspection ${body.status === "PASSED" ? "passed" : "failed"}`,
        permitId: id,
        metadata: { result: body.status },
      });
    } else if (body.status === "CANCELLED") {
      updateData.status = "CANCELLED";
    }

    const updated = await prisma.inspection.update({
      where: { id: inspectionId },
      data: updateData,
    });

    return success(updated);
  } catch (error) {
    console.error("Update inspection error:", error);
    return serverError("Failed to update inspection");
  }
}
