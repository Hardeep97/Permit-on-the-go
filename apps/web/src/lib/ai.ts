import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { prisma } from "@permits/database";

const GENERAL_SYSTEM_PROMPT = `You are the Permits on the Go AI assistant — an expert on the permit application process, building codes, and construction regulations with deep knowledge of New Jersey's Uniform Construction Code (UCC).

You help users:
- Understand the permit application process step by step
- Navigate subcode requirements (Building, Plumbing, Electrical, Fire, Zoning, Mechanical)
- Fill out permit forms correctly
- Prepare for inspections
- Understand code requirements for their projects
- Use the Permits on the Go app effectively

Keep responses concise, practical, and actionable. When referencing regulations, cite the specific code section when possible. If you're not sure about something, say so rather than guessing.`;

function buildPropertySystemPrompt(propertyContext: string) {
  return `You are the Permits on the Go AI assistant — an expert on permits and construction regulations. You are currently helping with a specific property and its permits.

Here is the context about this property and its permits:

${propertyContext}

Use this context to give specific, relevant answers about this property's permits, documents, inspections, and status. When the user asks about their permits or property, reference the actual data above.

Keep responses concise, practical, and actionable. If something requires action, tell the user exactly what to do in the app.`;
}

export async function buildPropertyContext(propertyId: string): Promise<string> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      permits: {
        include: {
          milestones: { orderBy: { sortOrder: "asc" }, take: 5 },
          inspections: { orderBy: { scheduledDate: "desc" }, take: 5 },
          _count: {
            select: { documents: true, photos: true, formSubmissions: true, messages: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      jurisdiction: { select: { name: true, state: true, phone: true, email: true } },
    },
  });

  if (!property) return "Property not found.";

  let context = `## Property: ${property.name}
- Address: ${property.address}, ${property.city}, ${property.state} ${property.zipCode}
- Type: ${property.propertyType}
- Block/Lot: ${property.blockLot || "N/A"}
- Zone: ${property.zoneDesignation || "N/A"}
`;

  if (property.jurisdiction) {
    context += `\n## Jurisdiction: ${property.jurisdiction.name}, ${property.jurisdiction.state}
- Phone: ${property.jurisdiction.phone || "N/A"}
- Email: ${property.jurisdiction.email || "N/A"}
`;
  }

  if (property.permits.length > 0) {
    context += `\n## Permits (${property.permits.length} total)\n`;
    for (const permit of property.permits) {
      context += `\n### ${permit.title} (${permit.internalRef})
- Status: ${permit.status}
- Subcode: ${permit.subcodeType}
- Project Type: ${permit.projectType}
- Priority: ${permit.priority}
- Documents: ${permit._count.documents}, Photos: ${permit._count.photos}, Forms: ${permit._count.formSubmissions}
`;
      if (permit.milestones.length > 0) {
        context += `- Milestones: ${permit.milestones.map((m) => `${m.title} (${m.status})`).join(", ")}\n`;
      }
      if (permit.inspections.length > 0) {
        context += `- Inspections: ${permit.inspections.map((i) => `${i.type} (${i.status})`).join(", ")}\n`;
      }
    }
  } else {
    context += "\nNo permits yet for this property.\n";
  }

  return context;
}

export async function streamChatResponse({
  messages,
  propertyId,
  ragContext,
}: {
  messages: { role: "user" | "assistant"; content: string }[];
  propertyId?: string;
  ragContext?: string;
}): Promise<{ textStreamResponse: Response; text: PromiseLike<string> }> {
  let systemPrompt = GENERAL_SYSTEM_PROMPT;

  if (propertyId) {
    const propertyContext = await buildPropertyContext(propertyId);
    systemPrompt = buildPropertySystemPrompt(propertyContext);
  }

  if (ragContext) {
    systemPrompt += `\n\n## Relevant Knowledge Base Information\n${ragContext}`;
  }

  const result = streamText({
    model: anthropic("claude-sonnet-4-5-20250929"),
    system: systemPrompt,
    messages,
  });

  return {
    textStreamResponse: result.toTextStreamResponse(),
    text: result.text,
  };
}
