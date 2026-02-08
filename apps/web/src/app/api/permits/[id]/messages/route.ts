import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import {
  getAuthenticatedUser,
  unauthorized,
  badRequest,
  success,
  serverError,
} from "@/lib/api-auth";
import { checkPermitAccess, forbidden } from "@/lib/rbac";
import { notifyPermitParties, NOTIFICATION_TYPES } from "@/lib/notifications";

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

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { permitId: id },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.message.count({ where: { permitId: id } }),
    ]);

    return success({
      messages,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("List messages error:", error);
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
    if (!access.permissions.includes("send_messages")) {
      return forbidden("You don't have permission to send messages on this permit");
    }

    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) return badRequest("Message content is required");

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderName: user.name,
        senderEmail: user.email,
        senderType: "USER",
        permitId: id,
      },
    });

    // Notify other parties
    await notifyPermitParties(
      id,
      user.id,
      "New Message",
      `${user.name}: ${content.trim().slice(0, 100)}${content.length > 100 ? "..." : ""}`,
      NOTIFICATION_TYPES.NEW_MESSAGE
    );

    return success(message, 201);
  } catch (error) {
    console.error("Create message error:", error);
    return serverError("Failed to send message");
  }
}
