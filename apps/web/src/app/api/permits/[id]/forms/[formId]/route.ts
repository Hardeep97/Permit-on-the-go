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
import { updateFormSubmissionSchema } from "@permits/shared";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; formId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id, formId } = await params;
    const access = await checkPermitAccess(id, user.id);
    if (!access) return forbidden("You don't have access to this permit");

    const submission = await prisma.formSubmission.findFirst({
      where: { id: formId, permitId: id },
      include: {
        template: true,
      },
    });

    if (!submission) return notFound("Form submission");

    return success(submission);
  } catch (error) {
    console.error("Get form submission error:", error);
    return serverError();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; formId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id, formId } = await params;
    const access = await checkPermitAccess(id, user.id);
    if (!access) return forbidden("You don't have access to this permit");
    if (!access.permissions.includes("edit")) return forbidden();

    const body = await request.json();
    const parsed = updateFormSubmissionSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.errors[0].message);

    const existing = await prisma.formSubmission.findFirst({
      where: { id: formId, permitId: id },
    });
    if (!existing) return notFound("Form submission");

    // Only allow editing drafts
    if (existing.status !== "DRAFT" && parsed.data.status !== "SUBMITTED") {
      return badRequest("Can only edit draft submissions");
    }

    const updated = await prisma.formSubmission.update({
      where: { id: formId },
      data: {
        ...(parsed.data.data && { data: parsed.data.data }),
        ...(parsed.data.status && { status: parsed.data.status }),
      },
      include: {
        template: { select: { id: true, name: true, subcodeType: true } },
      },
    });

    if (parsed.data.status === "SUBMITTED") {
      await logActivity({
        userId: user.id,
        action: ACTIONS.UPDATED,
        entityType: "FORM_SUBMISSION",
        entityId: formId,
        description: `Submitted form "${updated.template.name}"`,
        permitId: id,
      });
    }

    return success(updated);
  } catch (error) {
    console.error("Update form submission error:", error);
    return serverError("Failed to update form submission");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; formId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id, formId } = await params;
    const access = await checkPermitAccess(id, user.id);
    if (!access) return forbidden("You don't have access to this permit");
    if (!access.permissions.includes("delete")) return forbidden();

    const existing = await prisma.formSubmission.findFirst({
      where: { id: formId, permitId: id },
    });
    if (!existing) return notFound("Form submission");

    if (existing.status !== "DRAFT") {
      return badRequest("Can only delete draft submissions");
    }

    await prisma.formSubmission.delete({ where: { id: formId } });

    return success({ deleted: true });
  } catch (error) {
    console.error("Delete form submission error:", error);
    return serverError("Failed to delete form submission");
  }
}
