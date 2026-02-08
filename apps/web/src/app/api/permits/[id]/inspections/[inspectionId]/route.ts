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
import { checkPermitAccess, forbidden } from "@/lib/rbac";
import { triggerInspectionReminderEmails } from "@/lib/email-triggers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inspectionId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id, inspectionId } = await params;
    const access = await checkPermitAccess(id, user.id);
    if (!access) return forbidden("You don't have access to this permit");
    if (!access.permissions.includes("manage_inspections")) return forbidden();

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

    // Send inspection reminder if rescheduled
    if (body.scheduledDate && body.scheduledDate !== inspection.scheduledDate?.toISOString()) {
      triggerInspectionReminderEmails(
        id,
        updated.type,
        new Date(body.scheduledDate).toLocaleDateString(),
        updated.inspectorName || undefined
      ).catch(console.error);
    }

    return success(updated);
  } catch (error) {
    console.error("Update inspection error:", error);
    return serverError("Failed to update inspection");
  }
}
