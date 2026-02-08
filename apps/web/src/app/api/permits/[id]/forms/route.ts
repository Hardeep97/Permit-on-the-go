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
import { checkPermitAccess, forbidden } from "@/lib/rbac";
import { logActivity, ACTIONS } from "@/lib/activity";
import { submitFormSchema } from "@permits/shared";

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

    const submissions = await prisma.formSubmission.findMany({
      where: { permitId: id },
      include: {
        template: { select: { id: true, name: true, subcodeType: true, version: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return success(submissions);
  } catch (error) {
    console.error("List form submissions error:", error);
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
    if (!access.permissions.includes("edit")) return forbidden();

    const permit = await prisma.permit.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            owner: { select: { name: true, email: true, phone: true } },
          },
        },
      },
    });
    if (!permit) return notFound("Permit");

    const body = await request.json();
    const parsed = submitFormSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.errors[0].message);

    // Check that template exists
    const template = await prisma.formTemplate.findUnique({
      where: { id: parsed.data.templateId },
    });
    if (!template) return notFound("Form template");

    // Auto-fill data from property/owner if data is empty
    let formData = parsed.data.data;
    if (Object.keys(formData).length === 0 && template.defaultValues) {
      formData = template.defaultValues as Record<string, unknown>;
    }

    // Merge in known property/owner data for convenience
    const autoFill: Record<string, unknown> = {};
    if (permit.property) {
      autoFill.propertyAddress = permit.property.address;
      autoFill.propertyCity = permit.property.city;
      autoFill.propertyState = permit.property.state;
      autoFill.propertyZip = permit.property.zipCode;
      autoFill.blockLot = permit.property.blockLot;
    }
    if (permit.property?.owner) {
      autoFill.ownerName = permit.property.owner.name;
      autoFill.ownerEmail = permit.property.owner.email;
      autoFill.ownerPhone = permit.property.owner.phone;
    }

    // Auto-fill values only fill empty fields
    formData = { ...autoFill, ...formData };

    const submission = await prisma.formSubmission.create({
      data: {
        templateId: parsed.data.templateId,
        permitId: id,
        data: formData,
        status: parsed.data.status,
      },
      include: {
        template: { select: { id: true, name: true, subcodeType: true } },
      },
    });

    await logActivity({
      userId: user.id,
      action: ACTIONS.CREATED,
      entityType: "FORM_SUBMISSION",
      entityId: submission.id,
      description: `Started form "${template.name}"`,
      permitId: id,
    });

    return success(submission, 201);
  } catch (error) {
    console.error("Create form submission error:", error);
    return serverError("Failed to create form submission");
  }
}
