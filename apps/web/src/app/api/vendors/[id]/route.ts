import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import { updateVendorProfileSchema } from "@permits/shared";
import {
  getAuthenticatedUser,
  unauthorized,
  success,
  badRequest,
  notFound,
  serverError,
} from "@/lib/api-auth";
import { forbidden } from "@/lib/rbac";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vendor = await prisma.vendorProfile.findFirst({
      where: {
        id,
        isActive: true,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        licenses: true,
        insurance: true,
        photos: true,
        reviews: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!vendor) {
      return notFound("Vendor");
    }

    return success(vendor);
  } catch (error) {
    console.error("Get vendor error:", error);
    return serverError("Failed to get vendor");
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

    const vendor = await prisma.vendorProfile.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!vendor) {
      return notFound("Vendor");
    }

    if (vendor.userId !== user.id) {
      return forbidden("Not your vendor profile");
    }

    const body = await request.json();
    const parsed = updateVendorProfileSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    const updated = await prisma.vendorProfile.update({
      where: { id },
      data: parsed.data,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        licenses: true,
        insurance: true,
        photos: true,
      },
    });

    return success(updated);
  } catch (error) {
    console.error("Update vendor error:", error);
    return serverError("Failed to update vendor profile");
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

    const vendor = await prisma.vendorProfile.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!vendor) {
      return notFound("Vendor");
    }

    if (vendor.userId !== user.id) {
      return forbidden("Not your vendor profile");
    }

    await prisma.vendorProfile.update({
      where: { id },
      data: { isActive: false },
    });

    return success({ message: "Vendor profile deactivated" });
  } catch (error) {
    console.error("Delete vendor error:", error);
    return serverError("Failed to deactivate vendor profile");
  }
}
