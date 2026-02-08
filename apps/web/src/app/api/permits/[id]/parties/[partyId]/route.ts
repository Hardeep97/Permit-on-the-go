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
import { checkPermitAccess, forbidden } from "@/lib/rbac";
import { sendNotification, NOTIFICATION_TYPES } from "@/lib/notifications";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; partyId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id, partyId } = await params;
    const access = await checkPermitAccess(id, user.id);
    if (!access) return forbidden("You don't have access to this permit");
    if (!access.permissions.includes("manage_parties")) return forbidden();

    const body = await request.json();
    const { role, isPrimary } = body;

    const party = await prisma.permitParty.findFirst({
      where: { id: partyId, permitId: id },
      include: {
        user: { select: { id: true, name: true } },
        contact: { select: { name: true } },
      },
    });
    if (!party) return notFound("Party");

    const updateData: Record<string, unknown> = {};
    if (role) updateData.role = role;
    if (isPrimary !== undefined) updateData.isPrimary = isPrimary;

    const updated = await prisma.permitParty.update({
      where: { id: partyId },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        contact: true,
      },
    });

    const partyName = party.user?.name || party.contact?.name || "Unknown";

    await logActivity({
      userId: user.id,
      action: ACTIONS.UPDATED,
      entityType: "PARTY",
      entityId: partyId,
      description: `Updated ${partyName}'s role to ${role || party.role}`,
      permitId: id,
      metadata: { role: role || party.role, partyName },
    });

    return success(updated);
  } catch (error) {
    console.error("Update party error:", error);
    return serverError("Failed to update party");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; partyId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id, partyId } = await params;
    const access = await checkPermitAccess(id, user.id);
    if (!access) return forbidden("You don't have access to this permit");
    if (!access.permissions.includes("manage_parties")) return forbidden();

    const party = await prisma.permitParty.findFirst({
      where: { id: partyId, permitId: id },
      include: {
        user: { select: { id: true, name: true } },
        contact: { select: { name: true } },
        permit: { select: { title: true } },
      },
    });
    if (!party) return notFound("Party");

    const partyName = party.user?.name || party.contact?.name || "Unknown";

    await prisma.permitParty.delete({ where: { id: partyId } });

    await logActivity({
      userId: user.id,
      action: ACTIONS.DELETED,
      entityType: "PARTY",
      entityId: partyId,
      description: `Removed ${partyName} from permit`,
      permitId: id,
      metadata: { partyName, role: party.role },
    });

    // Notify removed party
    if (party.userId) {
      sendNotification({
        userId: party.userId,
        title: "Removed from Permit",
        body: `You've been removed from "${party.permit.title}"`,
        type: NOTIFICATION_TYPES.PARTY_REMOVED,
        entityType: "PERMIT",
        entityId: id,
        permitId: id,
      }).catch(console.error);
    }

    return success({ deleted: true });
  } catch (error) {
    console.error("Delete party error:", error);
    return serverError("Failed to remove party");
  }
}
