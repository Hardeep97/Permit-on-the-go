import { NextRequest } from "next/server";
import { getAuthenticatedUser, unauthorized, success, badRequest, notFound, serverError } from "@/lib/api-auth";
import { prisma } from "@permits/database";
import { createWorkflowTemplateSchema } from "@permits/shared";

/**
 * GET /api/workflows/[id]
 * Get a single workflow template with steps
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const template = await prisma.workflowTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return notFound("Workflow template");
    }

    return success(template);
  } catch (error) {
    console.error("Error fetching workflow template:", error);
    return serverError();
  }
}

/**
 * PATCH /api/workflows/[id]
 * Update a workflow template
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const { id } = await params;
    const body = await request.json();
    const validation = createWorkflowTemplateSchema.partial().safeParse(body);

    if (!validation.success) {
      return badRequest(validation.error.errors[0]?.message || "Invalid input");
    }

    const template = await prisma.workflowTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return notFound("Workflow template");
    }

    const { name, description, permitType, steps } = validation.data;

    const updated = await prisma.workflowTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(permitType !== undefined && { permitType: permitType || "" }),
        ...(steps !== undefined && { steps }),
      },
    });

    return success(updated);
  } catch (error) {
    console.error("Error updating workflow template:", error);
    return serverError();
  }
}

/**
 * DELETE /api/workflows/[id]
 * Delete a workflow template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const { id } = await params;

    const template = await prisma.workflowTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return notFound("Workflow template");
    }

    await prisma.workflowTemplate.delete({
      where: { id },
    });

    return success({ message: "Workflow template deleted successfully" });
  } catch (error) {
    console.error("Error deleting workflow template:", error);
    return serverError();
  }
}
