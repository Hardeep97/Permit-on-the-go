import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import {
  getAuthenticatedUser,
  unauthorized,
  notFound,
  success,
  serverError,
} from "@/lib/api-auth";
import { deleteFile } from "@/lib/storage";
import { checkPermitAccess, forbidden } from "@/lib/rbac";
import { logActivity, ACTIONS } from "@/lib/activity";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const photo = await prisma.permitPhoto.findUnique({
      where: { id },
      include: {
        uploadedBy: { select: { id: true, name: true } },
        photoShares: {
          select: { id: true, recipientEmail: true, recipientName: true, sentAt: true },
        },
      },
    });
    if (!photo) return notFound("Photo");

    const access = await checkPermitAccess(photo.permitId, user.id);
    if (!access) return forbidden("You don't have access to this photo");

    return success(photo);
  } catch (error) {
    console.error("Get photo error:", error);
    return serverError();
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
    const photo = await prisma.permitPhoto.findUnique({ where: { id } });
    if (!photo) return notFound("Photo");

    const access = await checkPermitAccess(photo.permitId, user.id);
    if (!access) return forbidden("You don't have access to this photo");
    if (!access.permissions.includes("delete")) return forbidden();

    // Delete from storage
    try {
      await deleteFile(photo.fileUrl);
    } catch {
      // Continue even if storage delete fails
    }

    await prisma.permitPhoto.delete({ where: { id } });

    await logActivity({
      userId: user.id,
      action: ACTIONS.DELETED,
      entityType: "PHOTO",
      entityId: id,
      description: `Deleted photo${photo.caption ? `: "${photo.caption}"` : ""}`,
      permitId: photo.permitId,
    });

    return success({ deleted: true });
  } catch (error) {
    console.error("Delete photo error:", error);
    return serverError("Failed to delete photo");
  }
}
