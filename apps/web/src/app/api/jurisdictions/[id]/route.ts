import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import { updateJurisdictionSchema } from "@permits/shared";
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
  try {
    const { id } = await params;

    const jurisdiction = await prisma.jurisdiction.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, name: true, type: true },
        },
        children: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            type: true,
            state: true,
            county: true,
            isVerified: true,
          },
        },
        _count: {
          select: { properties: true, permits: true },
        },
      },
    });

    if (!jurisdiction) return notFound("Jurisdiction");

    return success(jurisdiction);
  } catch (error) {
    console.error("Get jurisdiction error:", error);
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
    const parsed = updateJurisdictionSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    const existing = await prisma.jurisdiction.findUnique({
      where: { id },
    });
    if (!existing) return notFound("Jurisdiction");

    const { parentId, ...updateFields } = parsed.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      ...updateFields,
      ...(parentId !== undefined
        ? parentId
          ? { parent: { connect: { id: parentId } } }
          : { parent: { disconnect: true } }
        : {}),
    };
    const jurisdiction = await prisma.jurisdiction.update({
      where: { id },
      data: updateData,
      include: {
        parent: {
          select: { id: true, name: true, type: true },
        },
        _count: {
          select: { children: true, properties: true, permits: true },
        },
      },
    });

    return success(jurisdiction);
  } catch (error) {
    console.error("Update jurisdiction error:", error);
    return serverError("Failed to update jurisdiction");
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

    const existing = await prisma.jurisdiction.findUnique({
      where: { id },
      include: {
        _count: {
          select: { properties: true, permits: true },
        },
      },
    });

    if (!existing) return notFound("Jurisdiction");

    if (existing._count.properties > 0 || existing._count.permits > 0) {
      return badRequest(
        "Cannot delete jurisdiction with associated properties or permits"
      );
    }

    await prisma.jurisdiction.delete({ where: { id } });

    return success({ deleted: true });
  } catch (error) {
    console.error("Delete jurisdiction error:", error);
    return serverError("Failed to delete jurisdiction");
  }
}
