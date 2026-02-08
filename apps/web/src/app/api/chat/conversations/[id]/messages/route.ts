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
import { forbidden } from "@/lib/rbac";
import { streamChatResponse } from "@/lib/ai";
import { buildRAGContext } from "@/lib/rag";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    const conversation = await prisma.chatConversation.findUnique({ where: { id } });
    if (!conversation) return notFound("Conversation");
    if (conversation.userId !== user.id) return forbidden("Not your conversation");

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.chatMessage.count({ where: { conversationId: id } }),
    ]);

    return success({
      messages,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
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
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return badRequest("Message content is required");
    }

    // Verify conversation ownership
    const conversation = await prisma.chatConversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: { role: true, content: true },
        },
      },
    });
    if (!conversation) return notFound("Conversation");
    if (conversation.userId !== user.id) return forbidden("Not your conversation");

    // Check AI credits
    const subscription = await prisma.subscription.findFirst({
      where: { userId: user.id },
    });
    if (subscription && subscription.aiCreditsRemaining <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "AI credits exhausted. Please upgrade your plan.",
          code: "CREDITS_EXHAUSTED",
        }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      );
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        conversationId: id,
        role: "user",
        content: content.trim(),
      },
    });

    // Build message history for AI
    const messages = [
      ...conversation.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: content.trim() },
    ];

    // Get property context if conversation is linked to a property
    const context = conversation.context as { propertyId?: string } | null;
    const propertyId = context?.propertyId;

    // Get jurisdiction for RAG
    let jurisdiction: string | undefined;
    if (propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        include: { jurisdiction: { select: { state: true } } },
      });
      jurisdiction = property?.jurisdiction?.state;
    }

    // Build RAG context from knowledge base
    const ragContext = await buildRAGContext(content, jurisdiction);

    // Stream AI response
    const result = await streamChatResponse({
      messages,
      propertyId: propertyId || undefined,
      ragContext: ragContext || undefined,
    });

    // Decrement AI credits
    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { aiCreditsRemaining: { decrement: 1 } },
      });
    }

    // Update conversation timestamp
    await prisma.chatConversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    // Save assistant response after stream completes (fire and forget)
    const saveAssistantMessage = async () => {
      try {
        const fullText = await result.text;
        await prisma.chatMessage.create({
          data: {
            conversationId: id,
            role: "assistant",
            content: fullText,
            model: "claude-sonnet-4-5-20250929",
          },
        });
      } catch (err: unknown) {
        console.error("Failed to save assistant message:", err);
      }
    };
    saveAssistantMessage();

    // Return streaming response
    return result.textStreamResponse;
  } catch (error) {
    console.error("Send message error:", error);
    return serverError("Failed to send message");
  }
}
