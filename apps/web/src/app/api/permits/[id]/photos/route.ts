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
import { uploadFile } from "@/lib/storage";
import { checkPermitAccess, forbidden } from "@/lib/rbac";

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

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");

    const where: Record<string, unknown> = { permitId: id };
    if (stage) where.stage = stage;

    const photos = await prisma.permitPhoto.findMany({
      where,
      include: {
        uploadedBy: { select: { id: true, name: true } },
        photoShares: { select: { id: true, recipientEmail: true, recipientName: true, sentAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return success(photos);
  } catch (error) {
    console.error("List photos error:", error);
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
    if (!access.permissions.includes("upload_documents")) return forbidden();

    const permit = await prisma.permit.findUnique({ where: { id } });
    if (!permit) return notFound("Permit");

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const caption = formData.get("caption") as string | null;
    const stage = formData.get("stage") as string | null;

    if (!file) {
      return badRequest("Photo file is required");
    }

    if (!file.type.startsWith("image/")) {
      return badRequest("File must be an image");
    }

    if (file.size > 15 * 1024 * 1024) {
      return badRequest("Photo must be less than 15MB");
    }

    const uploaded = await uploadFile(file, `permits/${id}/photos`);

    const photo = await prisma.permitPhoto.create({
      data: {
        fileUrl: uploaded.url,
        fileName: uploaded.fileName,
        fileSize: uploaded.fileSize,
        mimeType: uploaded.mimeType,
        caption,
        stage,
        uploadedById: user.id,
        permitId: id,
      },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    await logActivity({
      userId: user.id,
      action: ACTIONS.PHOTO_UPLOADED,
      entityType: "PHOTO",
      entityId: photo.id,
      description: `Uploaded photo${caption ? `: "${caption}"` : ""}${stage ? ` (${stage})` : ""}`,
      permitId: id,
    });

    return success(photo, 201);
  } catch (error) {
    console.error("Upload photo error:", error);
    return serverError("Failed to upload photo");
  }
}
