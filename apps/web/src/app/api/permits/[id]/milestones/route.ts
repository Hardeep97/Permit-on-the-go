import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import { createMilestoneSchema } from "@permits/shared";
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

    const milestones = await prisma.permitMilestone.findMany({
      where: { permitId: id },
      orderBy: { sortOrder: "asc" },
    });

    return success(milestones);
  } catch (error) {
    console.error("List milestones error:", error);
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
    const parsed = createMilestoneSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    const access = await checkPermitAccess(id, user.id);
    if (!access) return forbidden("You don't have access to this permit");
    if (!access.permissions.includes("edit")) return forbidden();

    const permit = await prisma.permit.findUnique({ where: { id } });
    if (!permit) return notFound("Permit");

    // Get next sort order
    const lastMilestone = await prisma.permitMilestone.findFirst({
      where: { permitId: id },
      orderBy: { sortOrder: "desc" },
    });

    const milestone = await prisma.permitMilestone.create({
      data: {
        ...parsed.data,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
        permitId: id,
        sortOrder: parsed.data.sortOrder || (lastMilestone?.sortOrder ?? 0) + 1,
      },
    });

    await logActivity({
      userId: user.id,
      action: ACTIONS.CREATED,
      entityType: "MILESTONE",
      entityId: milestone.id,
      description: `Added milestone "${milestone.title}"`,
      permitId: id,
    });

    return success(milestone, 201);
  } catch (error) {
    console.error("Create milestone error:", error);
    return serverError("Failed to create milestone");
  }
}
