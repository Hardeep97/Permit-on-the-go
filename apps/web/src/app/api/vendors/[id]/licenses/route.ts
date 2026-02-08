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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const licenses = await prisma.vendorLicense.findMany({
      where: { vendorId: id },
      orderBy: { createdAt: "desc" },
    });

    return success(licenses);
  } catch (error) {
    console.error("List vendor licenses error:", error);
    return serverError("Failed to list licenses");
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
    const parsed = addVendorLicenseSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    const license = await prisma.vendorLicense.create({
      data: {
        ...parsed.data,
        vendorId: id,
        issuedAt: parsed.data.issuedAt ? new Date(parsed.data.issuedAt) : undefined,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
      },
    });

    return success(license, 201);
  } catch (error) {
    console.error("Add vendor license error:", error);
    return serverError("Failed to add license");
  }
}
