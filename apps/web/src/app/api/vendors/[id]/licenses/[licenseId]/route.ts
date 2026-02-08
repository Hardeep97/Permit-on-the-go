import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import { addVendorLicenseSchema } from "@permits/shared";
import {
  getAuthenticatedUser,
  unauthorized,
  success,
  badRequest,
  notFound,
  serverError,
} from "@/lib/api-auth";
import { forbidden } from "@/lib/rbac";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; licenseId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id, licenseId } = await params;

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

    const license = await prisma.vendorLicense.findUnique({
      where: { id: licenseId },
    });

    if (!license || license.vendorId !== id) {
      return notFound("License");
    }

    const body = await request.json();
    const parsed = addVendorLicenseSchema.partial().safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    const updated = await prisma.vendorLicense.update({
      where: { id: licenseId },
      data: {
        ...parsed.data,
        issuedAt: parsed.data.issuedAt ? new Date(parsed.data.issuedAt) : undefined,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
      },
    });

    return success(updated);
  } catch (error) {
    console.error("Update vendor license error:", error);
    return serverError("Failed to update license");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; licenseId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id, licenseId } = await params;

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

    const license = await prisma.vendorLicense.findUnique({
      where: { id: licenseId },
    });

    if (!license || license.vendorId !== id) {
      return notFound("License");
    }

    await prisma.vendorLicense.delete({
      where: { id: licenseId },
    });

    return success({ message: "License deleted" });
  } catch (error) {
    console.error("Delete vendor license error:", error);
    return serverError("Failed to delete license");
  }
}
