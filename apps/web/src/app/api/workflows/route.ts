import { NextRequest } from "next/server";
import { getAuthenticatedUser, unauthorized, success, badRequest, serverError } from "@/lib/api-auth";
import { prisma } from "@permits/database";
import { createWorkflowTemplateSchema } from "@permits/shared";

/**
 * GET /api/workflows
 * List workflow templates with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const permitType = searchParams.get("permitType");

    const where = permitType
      ? { permitType }
      : {};

    const templates = await prisma.workflowTemplate.findMany({
      where,
      orderBy: [
        { isDefault: "desc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        name: true,
        description: true,
        permitType: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return success(templates);
  } catch (error) {
    console.error("Error fetching workflow templates:", error);
    return serverError();
  }
}

/**
 * POST /api/workflows
 * Create a new workflow template
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const body = await request.json();
    const validation = createWorkflowTemplateSchema.safeParse(body);

    if (!validation.success) {
      return badRequest(validation.error.errors[0]?.message || "Invalid input");
    }

    const { name, description, permitType, steps } = validation.data;

    const template = await prisma.workflowTemplate.create({
      data: {
        name,
        description,
        permitType: permitType || "",
        steps,
        isDefault: false,
      },
    });

    return success(template, 201);
  } catch (error) {
    console.error("Error creating workflow template:", error);
    return serverError();
  }
}
