import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import { updatePermitSchema } from "@permits/shared";
import {
  getAuthenticatedUser,
  unauthorized,
  notFound,
  success,
  badRequest,
  serverError,
} from "@/lib/api-auth";
import { logActivity, ACTIONS } from "@/lib/activity";

async function verifyPermitAccess(permitId: string, userId: string) {
  return prisma.permit.findFirst({
    where: {
      id: permitId,
      OR: [
        { creatorId: userId },
        { parties: { some: { userId } } },
      ],
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const permit = await prisma.permit.findFirst({
      where: {
        id,
        OR: [
          { creatorId: user.id },
          { parties: { some: { userId: user.id } } },
        ],
      },
      include: {
        property: {
          select: {
            id: true, name: true, address: true, city: true,
            state: true, zipCode: true, blockLot: true, propertyType: true,
          },
        },
        jurisdiction: {
          select: {
            id: true, name: true, type: true, state: true,
            phone: true, email: true, permitPortalUrl: true,
          },
        },
        milestones: { orderBy: { sortOrder: "asc" } },
        inspections: { orderBy: { scheduledDate: "asc" } },
        parties: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            contact: true,
          },
        },
        _count: {
          select: {
            documents: true,
            photos: true,
            tasks: true,
            formSubmissions: true,
            messages: true,
          },
        },
      },
    });

    if (!permit) return notFound("Permit");

    return success(permit);
  } catch (error) {
    console.error("Get permit error:", error);
    return serverError();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const existing = await verifyPermitAccess(id, user.id);
    if (!existing) return notFound("Permit");

    const body = await request.json();
    const parsed = updatePermitSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    const updateData: Record<string, unknown> = { ...parsed.data };

    // Set date fields based on status transitions
    if (parsed.data.status) {
      const now = new Date();
      switch (parsed.data.status) {
        case "SUBMITTED":
          updateData.submittedAt = now;
          break;
        case "APPROVED":
          updateData.approvedAt = now;
          break;
        case "PERMIT_ISSUED":
          updateData.issuedAt = now;
          // Default expiry: 1 year from issuance
          if (!existing.expiresAt) {
            updateData.expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
          }
          break;
        case "CLOSED":
        case "EXPIRED":
        case "DENIED":
          updateData.closedAt = now;
          break;
      }
    }

    const permit = await prisma.permit.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          select: { id: true, name: true, address: true },
        },
      },
    });

    // Log status change specifically
    if (parsed.data.status && parsed.data.status !== existing.status) {
      await logActivity({
        userId: user.id,
        action: ACTIONS.STATUS_CHANGED,
        entityType: "PERMIT",
        entityId: id,
        description: `Status changed from ${existing.status} to ${parsed.data.status}`,
        permitId: id,
        metadata: {
          oldStatus: existing.status,
          newStatus: parsed.data.status,
        },
      });
    } else {
      await logActivity({
        userId: user.id,
        action: ACTIONS.UPDATED,
        entityType: "PERMIT",
        entityId: id,
        description: `Updated permit "${permit.title}"`,
        permitId: id,
      });
    }

    return success(permit);
  } catch (error) {
    console.error("Update permit error:", error);
    return serverError("Failed to update permit");
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
    const existing = await prisma.permit.findFirst({
      where: { id, creatorId: user.id },
    });
    if (!existing) return notFound("Permit");

    if (!["DRAFT", "DENIED", "CLOSED", "EXPIRED"].includes(existing.status)) {
      return badRequest("Can only delete permits in Draft, Denied, Closed, or Expired status");
    }

    await prisma.permit.delete({ where: { id } });

    return success({ deleted: true });
  } catch (error) {
    console.error("Delete permit error:", error);
    return serverError("Failed to delete permit");
  }
}
