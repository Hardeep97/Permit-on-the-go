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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    if (!document) return notFound("Document");

    return success(document);
  } catch (error) {
    console.error("Get document error:", error);
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
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) return notFound("Document");

    // Delete from storage
    try {
      await deleteFile(document.fileUrl);
    } catch {
      // Continue even if storage delete fails
    }

    await prisma.document.delete({ where: { id } });

    return success({ deleted: true });
  } catch (error) {
    console.error("Delete document error:", error);
    return serverError("Failed to delete document");
  }
}
