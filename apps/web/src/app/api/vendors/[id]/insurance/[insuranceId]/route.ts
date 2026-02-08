import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import { addVendorInsuranceSchema } from "@permits/shared";
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
  { params }: { params: Promise<{ id: string; insuranceId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id, insuranceId } = await params;

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

    const insurance = await prisma.vendorInsurance.findUnique({
      where: { id: insuranceId },
    });

    if (!insurance || insurance.vendorId !== id) {
      return notFound("Insurance");
    }

    const body = await request.json();
    const parsed = addVendorInsuranceSchema.partial().safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    const updated = await prisma.vendorInsurance.update({
      where: { id: insuranceId },
      data: {
        ...parsed.data,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
      },
    });

    return success(updated);
  } catch (error) {
    console.error("Update vendor insurance error:", error);
    return serverError("Failed to update insurance");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; insuranceId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id, insuranceId } = await params;

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

    const insurance = await prisma.vendorInsurance.findUnique({
      where: { id: insuranceId },
    });

    if (!insurance || insurance.vendorId !== id) {
      return notFound("Insurance");
    }

    await prisma.vendorInsurance.delete({
      where: { id: insuranceId },
    });

    return success({ message: "Insurance deleted" });
  } catch (error) {
    console.error("Delete vendor insurance error:", error);
    return serverError("Failed to delete insurance");
  }
}
