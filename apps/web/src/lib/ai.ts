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

Here is the LIVE context about this property, permits, tasks, team, and inspections:

${propertyContext}

IMPORTANT BEHAVIORS:
- When the user asks "what needs to be done" or "what's pending", summarize all pending tasks grouped by who they're assigned to
- When the user asks about a contractor/party, reference the team data above
- When asked about status, give a clear summary of where each permit stands and what the next step is
- When the user says the city gave feedback (e.g., corrections needed, approved, denied), advise on exact next steps
- If tasks are overdue, proactively mention them
- Reference actual permit numbers, names, and dates from the data above
- Keep responses concise, practical, and actionable
- If something requires action, tell the user exactly what to do in the app (e.g., "Go to Permits > [name] > Documents and upload the revised plans")`;
}

export async function buildPropertyContext(propertyId: string): Promise<string> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      permits: {
        include: {
          milestones: { orderBy: { sortOrder: "asc" }, take: 10 },
          inspections: { orderBy: { scheduledDate: "desc" }, take: 10 },
          tasks: {
            include: {
              assignee: { select: { name: true, email: true } },
              checklistItems: { orderBy: { sortOrder: "asc" } },
            },
            orderBy: { dueDate: "asc" },
          },
          parties: {
            include: {
              user: { select: { name: true, email: true } },
              contact: { select: { name: true, email: true, phone: true, company: true } },
            },
          },
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
        context += `- Inspections: ${permit.inspections.map((i) => `${i.type} on ${i.scheduledDate ? new Date(i.scheduledDate).toLocaleDateString() : "TBD"} (${i.status})`).join(", ")}\n`;
      }

      // Tasks / action items
      if (permit.tasks.length > 0) {
        const pendingTasks = permit.tasks.filter((t) => t.status !== "COMPLETED");
        const completedTasks = permit.tasks.filter((t) => t.status === "COMPLETED");
        context += `- Tasks: ${pendingTasks.length} pending, ${completedTasks.length} completed\n`;
        for (const task of pendingTasks) {
          const assignee = task.assignee?.name || "Unassigned";
          const due = task.dueDate
            ? `due ${new Date(task.dueDate).toLocaleDateString()}`
            : "no due date";
          context += `  - [${task.status}] "${task.title}" — assigned to ${assignee} (${due})\n`;
          if (task.checklistItems.length > 0) {
            const done = task.checklistItems.filter((ci) => ci.isCompleted).length;
            context += `    Checklist: ${done}/${task.checklistItems.length} items done\n`;
          }
        }
      }

      // Parties / team members
      if (permit.parties.length > 0) {
        context += `- Team:\n`;
        for (const party of permit.parties) {
          const name = party.user?.name || party.contact?.name || "Unknown";
          const email = party.user?.email || party.contact?.email || "";
          const company = party.contact?.company || "";
          context += `  - ${party.role}: ${name}${company ? ` (${company})` : ""}${email ? ` <${email}>` : ""}\n`;
        }
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
