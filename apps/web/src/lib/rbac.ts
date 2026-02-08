import { prisma } from "@permits/database";

export type PermitRole = "OWNER" | "EXPEDITOR" | "CONTRACTOR" | "ARCHITECT" | "ENGINEER" | "INSPECTOR" | "VIEWER";

export type PermitPermission = "read" | "edit" | "delete" | "manage_parties" | "upload_documents" | "manage_inspections" | "send_messages";

const ROLE_PERMISSIONS: Record<PermitRole, PermitPermission[]> = {
  OWNER: ["read", "edit", "delete", "manage_parties", "upload_documents", "manage_inspections", "send_messages"],
  EXPEDITOR: ["read", "edit", "manage_parties", "upload_documents", "manage_inspections", "send_messages"],
  CONTRACTOR: ["read", "upload_documents", "send_messages"],
  ARCHITECT: ["read", "upload_documents", "send_messages"],
  ENGINEER: ["read", "upload_documents", "send_messages"],
  INSPECTOR: ["read", "manage_inspections", "send_messages"],
  VIEWER: ["read"],
};

interface PermitAccessResult {
  hasAccess: boolean;
  role: PermitRole;
  permissions: PermitPermission[];
  isCreator: boolean;
}

/**
 * Check if a user has access to a permit and return their role/permissions.
 * Creator always gets OWNER-level access.
 */
export async function checkPermitAccess(
  permitId: string,
  userId: string
): Promise<PermitAccessResult | null> {
  const permit = await prisma.permit.findUnique({
    where: { id: permitId },
    select: {
      creatorId: true,
      parties: {
        where: { userId },
        select: { role: true },
      },
    },
  });

  if (!permit) return null;

  // Creator always has full access
  if (permit.creatorId === userId) {
    return {
      hasAccess: true,
      role: "OWNER",
      permissions: ROLE_PERMISSIONS.OWNER,
      isCreator: true,
    };
  }

  // Check if user is a party
  const party = permit.parties[0];
  if (!party) return null;

  const role = (party.role as PermitRole) || "VIEWER";
  return {
    hasAccess: true,
    role,
    permissions: ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.VIEWER,
    isCreator: false,
  };
}

/**
 * Check if user has a specific permission on a permit.
 */
export async function hasPermitPermission(
  permitId: string,
  userId: string,
  permission: PermitPermission
): Promise<boolean> {
  const access = await checkPermitAccess(permitId, userId);
  if (!access) return false;
  return access.permissions.includes(permission);
}

/**
 * Helper that returns a forbidden response.
 */
export function forbidden(message: string = "You don't have permission to perform this action") {
  // Dynamic import to avoid circular dependency at module level
  const { NextResponse } = require("next/server") as typeof import("next/server");
  return NextResponse.json(
    { success: false, error: message, code: "FORBIDDEN" },
    { status: 403 }
  );
}
