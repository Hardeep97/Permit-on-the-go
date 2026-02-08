import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import { createInspectionSchema } from "@permits/shared";
import {
  getAuthenticatedUser,
  unauthorized,
  notFound,
  success,
  badRequest,
  serverError,
} from "@/lib/api-auth";
import { logActivity, ACTIONS } from "@/lib/activity";
import { checkPermitAccess, forbidden } from "@/lib/rbac";
import { triggerInspectionReminderEmails } from "@/lib/email-triggers";

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

    const inspections = await prisma.inspection.findMany({
      where: { permitId: id },
      orderBy: { scheduledDate: "asc" },
    });

    return success(inspections);
  } catch (error) {
    console.error("List inspections error:", error);
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
    const body = await request.json();
    const parsed = createInspectionSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    const access = await checkPermitAccess(id, user.id);
    if (!access) return forbidden("You don't have access to this permit");
    if (!access.permissions.includes("manage_inspections")) return forbidden();

    const permit = await prisma.permit.findUnique({ where: { id } });
    if (!permit) return notFound("Permit");

    const inspection = await prisma.inspection.create({
      data: {
        ...parsed.data,
        scheduledDate: parsed.data.scheduledDate ? new Date(parsed.data.scheduledDate) : undefined,
        permitId: id,
        status: parsed.data.scheduledDate ? "SCHEDULED" : "NOT_SCHEDULED",
      },
    });

    await logActivity({
      userId: user.id,
      action: ACTIONS.INSPECTION_SCHEDULED,
      entityType: "INSPECTION",
      entityId: inspection.id,
      description: `Scheduled ${inspection.type} inspection`,
      permitId: id,
    });

    // Send inspection reminder emails
    if (inspection.scheduledDate) {
      triggerInspectionReminderEmails(
        id,
        inspection.type,
        new Date(inspection.scheduledDate).toLocaleDateString(),
        inspection.inspectorName || undefined
      ).catch(console.error);
    }

    return success(inspection, 201);
  } catch (error) {
    console.error("Create inspection error:", error);
    return serverError("Failed to create inspection");
  }
}
