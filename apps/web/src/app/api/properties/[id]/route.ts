import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import { updatePropertySchema } from "@permits/shared";
import {
  getAuthenticatedUser,
  unauthorized,
  notFound,
  success,
  badRequest,
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
    const property = await prisma.property.findFirst({
      where: { id, ownerId: user.id },
      include: {
        jurisdiction: true,
        permits: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            title: true,
            status: true,
            subcodeType: true,
            createdAt: true,
          },
        },
        _count: {
          select: { permits: true, documents: true },
        },
      },
    });

    if (!property) return notFound("Property");

    return success(property);
  } catch (error) {
    console.error("Get property error:", error);
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
    const parsed = updatePropertySchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    // Verify ownership
    const existing = await prisma.property.findFirst({
      where: { id, ownerId: user.id },
    });
    if (!existing) return notFound("Property");

    const property = await prisma.property.update({
      where: { id },
      data: parsed.data,
      include: {
        jurisdiction: {
          select: { id: true, name: true, type: true },
        },
        _count: {
          select: { permits: true },
        },
      },
    });

    return success(property);
  } catch (error) {
    console.error("Update property error:", error);
    return serverError("Failed to update property");
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

    // Verify ownership
    const existing = await prisma.property.findFirst({
      where: { id, ownerId: user.id },
    });
    if (!existing) return notFound("Property");

    // Check for active permits
    const activePermits = await prisma.permit.count({
      where: {
        propertyId: id,
        status: { notIn: ["CLOSED", "EXPIRED", "DENIED"] },
      },
    });

    if (activePermits > 0) {
      return badRequest(
        `Cannot delete property with ${activePermits} active permit(s). Close or remove permits first.`
      );
    }

    await prisma.property.delete({ where: { id } });

    return success({ deleted: true });
  } catch (error) {
    console.error("Delete property error:", error);
    return serverError("Failed to delete property");
  }
}
