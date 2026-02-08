import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import {
  createJurisdictionSchema,
  jurisdictionSearchSchema,
} from "@permits/shared";
import {
  getAuthenticatedUser,
  unauthorized,
  success,
  badRequest,
  serverError,
} from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const parsed = jurisdictionSearchSchema.safeParse(params);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    const { state, county, search, type, parentId, isVerified, page, pageSize } =
      parsed.data;

    const where: Record<string, unknown> = {};

    if (state) where.state = state;
    if (county) where.county = county;
    if (type) where.type = type;
    if (parentId) where.parentId = parentId;
    if (isVerified !== undefined) where.isVerified = isVerified;
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const [jurisdictions, total] = await Promise.all([
      prisma.jurisdiction.findMany({
        where,
        include: {
          parent: {
            select: { id: true, name: true, type: true },
          },
          _count: {
            select: { children: true, properties: true, permits: true },
          },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.jurisdiction.count({ where }),
    ]);

    return success({
      jurisdictions,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("List jurisdictions error:", error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const parsed = createJurisdictionSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    const { parentId, ...rest } = parsed.data;

    // Auto-lookup parentId: if not provided but state is, find the STATE-level jurisdiction
    let resolvedParentId = parentId;
    if (!resolvedParentId && rest.state) {
      const stateJurisdiction = await prisma.jurisdiction.findFirst({
        where: {
          state: rest.state,
          type: "STATE",
        },
        select: { id: true },
      });

      if (stateJurisdiction) {
        resolvedParentId = stateJurisdiction.id;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createData: any = {
      ...rest,
      ...(resolvedParentId ? { parent: { connect: { id: resolvedParentId } } } : {}),
    };

    const jurisdiction = await prisma.jurisdiction.create({
      data: createData,
      include: {
        parent: {
          select: { id: true, name: true, type: true },
        },
        _count: {
          select: { children: true, properties: true, permits: true },
        },
      },
    });

    return success(jurisdiction, 201);
  } catch (error) {
    console.error("Create jurisdiction error:", error);
    return serverError("Failed to create jurisdiction");
  }
}
