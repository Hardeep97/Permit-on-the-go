import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import {
  getAuthenticatedUser,
  unauthorized,
  notFound,
  success,
  serverError,
} from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id } = await params;

    const template = await prisma.formTemplate.findUnique({
      where: { id },
      include: {
        jurisdiction: { select: { id: true, name: true, state: true } },
      },
    });

    if (!template) return notFound("Form template");

    return success(template);
  } catch (error) {
    console.error("Get form template error:", error);
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
    const body = await request.json();

    const template = await prisma.formTemplate.findUnique({ where: { id } });
    if (!template) return notFound("Form template");

    const updated = await prisma.formTemplate.update({
      where: { id },
      data: body,
    });

    return success(updated);
  } catch (error) {
    console.error("Update form template error:", error);
    return serverError("Failed to update form template");
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

    const template = await prisma.formTemplate.findUnique({ where: { id } });
    if (!template) return notFound("Form template");

    // Soft delete by deactivating
    await prisma.formTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    return success({ deleted: true });
  } catch (error) {
    console.error("Delete form template error:", error);
    return serverError("Failed to delete form template");
  }
}
