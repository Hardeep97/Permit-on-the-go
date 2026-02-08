import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import { PERMIT_STATUS_TRANSITIONS, type PermitStatus } from "@permits/shared";
import {
  getAuthenticatedUser,
  unauthorized,
  notFound,
  success,
  badRequest,
  serverError,
} from "@/lib/api-auth";
import { logActivity, ACTIONS } from "@/lib/activity";
import { notifyPermitParties, NOTIFICATION_TYPES } from "@/lib/notifications";
import { triggerStatusChangeEmails } from "@/lib/email-triggers";
import { PERMIT_STATUS_LABELS } from "@permits/shared";
import { checkPermitAccess, forbidden } from "@/lib/rbac";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const body = await request.json();
    const { status: newStatus } = body;

    if (!newStatus) {
      return badRequest("Status is required");
    }

    const access = await checkPermitAccess(id, user.id);
    if (!access) return forbidden("You don't have access to this permit");
    if (!access.permissions.includes("edit")) return forbidden();

    const permit = await prisma.permit.findUnique({ where: { id } });
    if (!permit) return notFound("Permit");

    // Validate status transition
    const currentStatus = permit.status as PermitStatus;
    const allowedTransitions = PERMIT_STATUS_TRANSITIONS[currentStatus];

    if (!allowedTransitions || !allowedTransitions.includes(newStatus as PermitStatus)) {
      return badRequest(
        `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowedTransitions?.join(", ") || "none"}`
      );
    }

    const updateData: Record<string, unknown> = { status: newStatus };
    const now = new Date();

    switch (newStatus) {
      case "SUBMITTED":
        updateData.submittedAt = now;
        break;
      case "APPROVED":
        updateData.approvedAt = now;
        break;
      case "PERMIT_ISSUED":
        updateData.issuedAt = now;
        if (!permit.expiresAt) {
          updateData.expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        }
        break;
      case "CLOSED":
      case "EXPIRED":
      case "DENIED":
        updateData.closedAt = now;
        break;
    }

    const updated = await prisma.permit.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          select: { id: true, name: true, address: true },
        },
      },
    });

    await logActivity({
      userId: user.id,
      action: ACTIONS.STATUS_CHANGED,
      entityType: "PERMIT",
      entityId: id,
      description: `Status changed from ${currentStatus} to ${newStatus}`,
      permitId: id,
      metadata: { oldStatus: currentStatus, newStatus },
    });

    // Notify parties + send emails (fire and forget)
    const newLabel = PERMIT_STATUS_LABELS[newStatus as keyof typeof PERMIT_STATUS_LABELS] || newStatus;
    notifyPermitParties(
      id,
      user.id,
      "Permit Status Updated",
      `${updated.title} is now ${newLabel}`,
      NOTIFICATION_TYPES.STATUS_CHANGED
    ).catch(console.error);

    triggerStatusChangeEmails(id, user.id, currentStatus, newStatus).catch(console.error);

    return success(updated);
  } catch (error) {
    console.error("Update permit status error:", error);
    return serverError("Failed to update permit status");
  }
}
