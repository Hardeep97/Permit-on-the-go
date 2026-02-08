import { prisma } from "@permits/database";

interface CreateNotificationParams {
  userId: string;
  title: string;
  body: string;
  type: string;
  entityType?: string;
  entityId?: string;
  permitId?: string;
  actionUrl?: string;
}

/**
 * Create an in-app notification and optionally send a push notification.
 */
export async function sendNotification(params: CreateNotificationParams) {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      body: params.body,
      type: params.type,
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        permitId: params.permitId,
        actionUrl: params.actionUrl,
      },
    },
  });

  // Send push notification if user has push tokens
  try {
    const tokens = await prisma.pushToken.findMany({
      where: { userId: params.userId },
      select: { token: true, platform: true },
    });

    if (tokens.length > 0) {
      await sendPushNotifications(
        tokens.map((t) => t.token),
        params.title,
        params.body,
        {
          type: params.type,
          entityId: params.entityId,
          permitId: params.permitId,
          actionUrl: params.actionUrl,
        }
      );
    }
  } catch (error) {
    console.error("Push notification error:", error);
  }

  return notification;
}

/**
 * Notify all parties on a permit (except the actor).
 */
export async function notifyPermitParties(
  permitId: string,
  actorUserId: string,
  title: string,
  body: string,
  type: string,
  actionUrl?: string
) {
  const parties = await prisma.permitParty.findMany({
    where: {
      permitId,
      userId: { not: null },
    },
    select: { userId: true },
  });

  const permit = await prisma.permit.findUnique({
    where: { id: permitId },
    select: { creatorId: true },
  });

  const userIds = new Set<string>();
  for (const party of parties) {
    if (party.userId) userIds.add(party.userId);
  }
  if (permit?.creatorId) userIds.add(permit.creatorId);
  userIds.delete(actorUserId);

  const promises = Array.from(userIds).map((userId) =>
    sendNotification({
      userId,
      title,
      body,
      type,
      entityType: "PERMIT",
      entityId: permitId,
      permitId,
      actionUrl: actionUrl || `/dashboard/permits/${permitId}`,
    })
  );

  return Promise.allSettled(promises);
}

/**
 * Send push notifications via Expo Push API.
 */
async function sendPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  const messages = tokens
    .filter((token) => token.startsWith("ExponentPushToken"))
    .map((token) => ({
      to: token,
      sound: "default" as const,
      title,
      body,
      data,
    }));

  if (messages.length === 0) return;

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    console.error("Expo push error:", await response.text());
  }
}

export const NOTIFICATION_TYPES = {
  STATUS_CHANGED: "STATUS_CHANGED",
  PARTY_ADDED: "PARTY_ADDED",
  PARTY_REMOVED: "PARTY_REMOVED",
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  PHOTO_SHARED: "PHOTO_SHARED",
  INSPECTION_SCHEDULED: "INSPECTION_SCHEDULED",
  INSPECTION_COMPLETED: "INSPECTION_COMPLETED",
  MILESTONE_COMPLETED: "MILESTONE_COMPLETED",
  MILESTONE_DUE: "MILESTONE_DUE",
  NEW_MESSAGE: "NEW_MESSAGE",
} as const;
