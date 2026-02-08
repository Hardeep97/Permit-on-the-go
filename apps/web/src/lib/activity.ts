import { prisma } from "@permits/database";

interface LogActivityParams {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  permitId?: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  description,
  permitId,
  metadata,
}: LogActivityParams) {
  return prisma.activityLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      description,
      permitId,
      metadata: metadata as Record<string, string | number | boolean> | undefined,
    },
  });
}

export const ACTIONS = {
  CREATED: "CREATED",
  UPDATED: "UPDATED",
  DELETED: "DELETED",
  STATUS_CHANGED: "STATUS_CHANGED",
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  PHOTO_UPLOADED: "PHOTO_UPLOADED",
  PHOTO_SHARED: "PHOTO_SHARED",
  PARTY_ADDED: "PARTY_ADDED",
  PARTY_REMOVED: "PARTY_REMOVED",
  MILESTONE_COMPLETED: "MILESTONE_COMPLETED",
  INSPECTION_SCHEDULED: "INSPECTION_SCHEDULED",
  INSPECTION_COMPLETED: "INSPECTION_COMPLETED",
  TASK_ASSIGNED: "TASK_ASSIGNED",
  TASK_COMPLETED: "TASK_COMPLETED",
} as const;
