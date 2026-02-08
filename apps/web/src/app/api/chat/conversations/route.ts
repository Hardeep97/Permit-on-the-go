import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import {
  getAuthenticatedUser,
  unauthorized,
  success,
  badRequest,
  serverError,
} from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { searchParams } = request.nextUrl;
    const propertyId = searchParams.get("propertyId");

    const where: Record<string, unknown> = { userId: user.id };

    // Filter by propertyId if provided (stored in context JSON)
    const conversations = await prisma.chatConversation.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, role: true, createdAt: true },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    // If filtering by propertyId, do it in-memory since context is JSON
    const filtered = propertyId
      ? conversations.filter((c) => {
          const ctx = c.context as { propertyId?: string } | null;
          return ctx?.propertyId === propertyId;
        })
      : conversations;

    return success(filtered);
  } catch (error) {
    console.error("List conversations error:", error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { title, propertyId, permitId } = body;

    // Build context
    const context: Record<string, string> = {};
    if (propertyId) context.propertyId = propertyId;
    if (permitId) context.permitId = permitId;

    // If propertyId, verify user owns the property
    if (propertyId) {
      const property = await prisma.property.findFirst({
        where: { id: propertyId, ownerId: user.id },
      });
      if (!property) return badRequest("Property not found or not owned by you");
    }

    const conversation = await prisma.chatConversation.create({
      data: {
        title: title || (propertyId ? "Property Chat" : "General Chat"),
        userId: user.id,
        context: Object.keys(context).length > 0 ? context : undefined,
      },
    });

    return success(conversation, 201);
  } catch (error) {
    console.error("Create conversation error:", error);
    return serverError("Failed to create conversation");
  }
}
