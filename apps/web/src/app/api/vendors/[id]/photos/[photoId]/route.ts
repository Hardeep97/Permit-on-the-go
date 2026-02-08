import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import {
  getAuthenticatedUser,
  unauthorized,
  success,
  notFound,
  serverError,
} from "@/lib/api-auth";
import { forbidden } from "@/lib/rbac";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id, photoId } = await params;

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

    const photo = await prisma.vendorPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.vendorId !== id) {
      return notFound("Photo");
    }

    await prisma.vendorPhoto.delete({
      where: { id: photoId },
    });

    return success({ message: "Photo deleted" });
  } catch (error) {
    console.error("Delete vendor photo error:", error);
    return serverError("Failed to delete photo");
  }
}
