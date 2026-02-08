import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import {
  getAuthenticatedUser,
  unauthorized,
  success,
  badRequest,
  serverError,
} from "@/lib/api-auth";
import { createFormTemplateSchema } from "@permits/shared";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { searchParams } = request.nextUrl;
    const subcodeType = searchParams.get("subcodeType");
    const jurisdictionId = searchParams.get("jurisdictionId");

    const where: Record<string, unknown> = { isActive: true };
    if (subcodeType) where.subcodeType = subcodeType;
    if (jurisdictionId) where.jurisdictionId = jurisdictionId;

    const templates = await prisma.formTemplate.findMany({
      where,
      include: {
        jurisdiction: { select: { id: true, name: true, state: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { name: "asc" },
    });

    return success(templates);
  } catch (error) {
    console.error("List form templates error:", error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const parsed = createFormTemplateSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.errors[0].message);

    const template = await prisma.formTemplate.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        subcodeType: parsed.data.subcodeType,
        jurisdictionId: parsed.data.jurisdictionId,
        schema: parsed.data.schema,
        uiSchema: parsed.data.uiSchema,
        defaultValues: parsed.data.defaultValues,
      },
    });

    return success(template, 201);
  } catch (error) {
    console.error("Create form template error:", error);
    return serverError("Failed to create form template");
  }
}
