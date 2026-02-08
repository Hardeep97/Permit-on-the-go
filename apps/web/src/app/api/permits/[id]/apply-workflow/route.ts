import { NextRequest } from "next/server";
import { getAuthenticatedUser, unauthorized, success, badRequest, notFound, serverError } from "@/lib/api-auth";
import { checkPermitAccess, forbidden } from "@/lib/rbac";
import { prisma } from "@permits/database";
import { z } from "zod";

const applyWorkflowSchema = z.object({
  templateId: z.string().min(1, "Template ID is required"),
});

interface WorkflowStep {
  title: string;
  description?: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  estimatedDays?: number;
  sortOrder: number;
}

/**
 * POST /api/permits/[id]/apply-workflow
 * Apply a workflow template to a permit by creating tasks
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const { id } = await params;

    // Check permit access
    const access = await checkPermitAccess(id, user.id);
    if (!access || !access.permissions.includes("edit")) {
      return forbidden("You don't have permission to modify this permit");
    }

    // Parse and validate body
    const body = await request.json();
    const validation = applyWorkflowSchema.safeParse(body);

    if (!validation.success) {
      return badRequest(validation.error.errors[0]?.message || "Invalid input");
    }

    const { templateId } = validation.data;

    // Fetch the workflow template
    const template = await prisma.workflowTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return notFound("Workflow template");
    }

    // Parse the steps from JSON
    const steps = template.steps as unknown as WorkflowStep[];

    if (!Array.isArray(steps) || steps.length === 0) {
      return badRequest("Workflow template has no steps");
    }

    // Create tasks from the template steps
    const today = new Date();
    const tasksToCreate = steps.map((step) => {
      let dueDate: Date | undefined;
      if (step.estimatedDays) {
        dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + step.estimatedDays);
      }

      return {
        title: step.title,
        description: step.description || null,
        priority: step.priority,
        status: "TODO",
        permitId: id,
        creatorId: user.id,
        sortOrder: step.sortOrder,
        dueDate,
      };
    });

    // Create all tasks in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.task.createMany({
        data: tasksToCreate,
      });
    });

    // Fetch the created tasks with includes
    const createdTasks = await prisma.task.findMany({
      where: {
        permitId: id,
        creatorId: user.id,
        title: { in: steps.map((s) => s.title) },
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        checklistItems: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return success({
      message: `Applied workflow template "${template.name}" - created ${createdTasks.length} tasks`,
      tasks: createdTasks,
    }, 201);
  } catch (error) {
    console.error("Error applying workflow template:", error);
    return serverError();
  }
}
