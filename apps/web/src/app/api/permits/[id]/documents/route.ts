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

    const documents = await prisma.document.findMany({
      where: { permitId: id, isArchived: false },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return success(documents);
  } catch (error) {
    console.error("List documents error:", error);
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
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const category = formData.get("category") as string || "OTHER";

    if (!file) {
      return badRequest("File is required");
    }

    if (file.size > 10 * 1024 * 1024) {
      return badRequest("File size must be less than 10MB");
    }

    const uploaded = await uploadFile(file, `permits/${id}/documents`);

    const document = await prisma.document.create({
      data: {
        title: title || file.name,
        description,
        fileUrl: uploaded.url,
        fileName: uploaded.fileName,
        fileSize: uploaded.fileSize,
        mimeType: uploaded.mimeType,
        category,
        uploadedById: user.id,
        permitId: id,
        propertyId: permit.propertyId,
      },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    await logActivity({
      userId: user.id,
      action: ACTIONS.DOCUMENT_UPLOADED,
      entityType: "DOCUMENT",
      entityId: document.id,
      description: `Uploaded document "${document.title}"`,
      permitId: id,
      metadata: { fileName: uploaded.fileName, category },
    });

    return success(document, 201);
  } catch (error) {
    console.error("Upload document error:", error);
    return serverError("Failed to upload document");
  }
}
