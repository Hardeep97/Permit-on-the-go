import { NextRequest } from "next/server";
import { prisma } from "@permits/database";
import {
  getAuthenticatedUser,
  unauthorized,
  success,
  serverError,
} from "@/lib/api-auth";

interface TimelineEvent {
  id: string;
  type: "milestone" | "inspection" | "status_change" | "document" | "photo" | "activity";
  title: string;
  description?: string;
  status?: string;
  date: string;
  metadata?: Record<string, unknown>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id } = await params;

    // Fetch all timeline-relevant data in parallel
    const [milestones, inspections, activities, documents, photos] = await Promise.all([
      prisma.permitMilestone.findMany({
        where: { permitId: id },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.inspection.findMany({
        where: { permitId: id },
        orderBy: { scheduledDate: "asc" },
      }),
      prisma.activityLog.findMany({
        where: { permitId: id, action: "STATUS_CHANGED" },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.document.findMany({
        where: { permitId: id },
        select: { id: true, title: true, category: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.permitPhoto.findMany({
        where: { permitId: id },
        select: { id: true, caption: true, stage: true, fileUrl: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const events: TimelineEvent[] = [];

    // Add milestones
    for (const m of milestones) {
      events.push({
        id: `milestone-${m.id}`,
        type: "milestone",
        title: m.title,
        description: m.description ?? undefined,
        status: m.status,
        date: (m.completedAt || m.dueDate || m.createdAt).toISOString(),
        metadata: { milestoneId: m.id },
      });
    }

    // Add inspections
    for (const i of inspections) {
      events.push({
        id: `inspection-${i.id}`,
        type: "inspection",
        title: `${i.type} Inspection`,
        description: i.notes ?? undefined,
        status: i.status,
        date: (i.completedDate || i.scheduledDate || i.createdAt).toISOString(),
        metadata: {
          inspectionId: i.id,
          inspectorName: i.inspectorName,
          result: i.result,
        },
      });
    }

    // Add status changes
    for (const a of activities) {
      events.push({
        id: `status-${a.id}`,
        type: "status_change",
        title: a.description,
        date: a.createdAt.toISOString(),
        metadata: a.metadata as Record<string, unknown> | undefined,
      });
    }

    // Add documents
    for (const d of documents) {
      events.push({
        id: `doc-${d.id}`,
        type: "document",
        title: `Document uploaded: ${d.title}`,
        status: d.category,
        date: d.createdAt.toISOString(),
      });
    }

    // Add photos
    for (const p of photos) {
      events.push({
        id: `photo-${p.id}`,
        type: "photo",
        title: p.caption || "Photo uploaded",
        status: p.stage ?? undefined,
        date: p.createdAt.toISOString(),
        metadata: { fileUrl: p.fileUrl },
      });
    }

    // Sort all events by date descending
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return success(events);
  } catch (error) {
    console.error("Get timeline error:", error);
    return serverError();
  }
}
