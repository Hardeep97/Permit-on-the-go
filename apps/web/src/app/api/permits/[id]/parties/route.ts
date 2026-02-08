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
import { logActivity, ACTIONS } from "@/lib/activity";
import { sendNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { triggerPartyAddedEmail } from "@/lib/email-triggers";
import { checkPermitAccess, forbidden } from "@/lib/rbac";

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

    const parties = await prisma.permitParty.findMany({
      where: { permitId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true, phone: true },
        },
        contact: true,
      },
      orderBy: { addedAt: "asc" },
    });

    return success(parties);
  } catch (error) {
    console.error("List parties error:", error);
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
    const { role, userId, contact: contactData, isPrimary } = body;

    if (!role) return badRequest("Role is required");

    const access = await checkPermitAccess(id, user.id);
    if (!access) return forbidden("You don't have access to this permit");
    if (!access.permissions.includes("manage_parties")) return forbidden();

    const permit = await prisma.permit.findUnique({ where: { id } });
    if (!permit) return notFound("Permit");

    let contactId: string | undefined;

    // If adding by contact info (not an existing user)
    if (contactData && !userId) {
      if (!contactData.name) return badRequest("Contact name is required");

      const contact = await prisma.contact.create({
        data: {
          name: contactData.name,
          email: contactData.email,
          phone: contactData.phone,
          company: contactData.company,
          title: contactData.title,
          licenseNumber: contactData.licenseNumber,
          contactType: role,
          createdById: user.id,
        },
      });
      contactId = contact.id;
    }

    // Check for duplicate user on permit
    if (userId) {
      const existing = await prisma.permitParty.findFirst({
        where: { permitId: id, userId },
      });
      if (existing) return badRequest("This user is already a party on this permit");
    }

    const party = await prisma.permitParty.create({
      data: {
        role,
        isPrimary: isPrimary || false,
        permitId: id,
        userId: userId || null,
        contactId: contactId || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        contact: true,
      },
    });

    const partyName = party.user?.name || party.contact?.name || "Unknown";

    await logActivity({
      userId: user.id,
      action: ACTIONS.PARTY_ADDED,
      entityType: "PARTY",
      entityId: party.id,
      description: `Added ${partyName} as ${role}`,
      permitId: id,
      metadata: { role, partyName },
    });

    // Notify the added party and send welcome email
    const partyEmail = party.user?.email || party.contact?.email;
    if (party.userId) {
      sendNotification({
        userId: party.userId,
        title: "Added to Permit",
        body: `You've been added as ${role} on "${permit.title}"`,
        type: NOTIFICATION_TYPES.PARTY_ADDED,
        entityType: "PERMIT",
        entityId: id,
        permitId: id,
      }).catch(console.error);
    }

    if (partyEmail) {
      triggerPartyAddedEmail(id, partyEmail, partyName, role, user.name).catch(console.error);
    }

    return success(party, 201);
  } catch (error) {
    console.error("Add party error:", error);
    return serverError("Failed to add party");
  }
}
