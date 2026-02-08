import { NextRequest } from "next/server";
import {
  getAuthenticatedUser,
  unauthorized,
  success,
  badRequest,
  serverError,
} from "@/lib/api-auth";
import { prisma } from "@permits/database";
import {
  createConnectAccount,
  createConnectOnboardingLink,
  createConnectLoginLink,
  getConnectAccountStatus,
} from "@/lib/stripe-connect";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const { id } = await params;

    // Verify vendor ownership
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id },
      select: {
        userId: true,
        stripeConnectId: true,
      },
    });

    if (!vendor) {
      return badRequest("Vendor not found");
    }

    if (vendor.userId !== user.id) {
      return unauthorized();
    }

    // No Stripe Connect account yet
    if (!vendor.stripeConnectId) {
      return success({ connected: false });
    }

    // Get account status
    const status = await getConnectAccountStatus(vendor.stripeConnectId);

    // If fully onboarded, get dashboard link
    let dashboardUrl: string | undefined;
    if (status.chargesEnabled && status.detailsSubmitted) {
      dashboardUrl = await createConnectLoginLink(vendor.stripeConnectId);
    }

    return success({
      connected: true,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      detailsSubmitted: status.detailsSubmitted,
      dashboardUrl,
    });
  } catch (error) {
    console.error("Error getting Stripe Connect status:", error);
    return serverError("Failed to get Stripe Connect status");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const { id } = await params;

    // Verify vendor ownership
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id },
      select: {
        userId: true,
        stripeConnectId: true,
      },
    });

    if (!vendor) {
      return badRequest("Vendor not found");
    }

    if (vendor.userId !== user.id) {
      return unauthorized();
    }

    // If vendor already has a Stripe Connect account
    if (vendor.stripeConnectId) {
      const status = await getConnectAccountStatus(vendor.stripeConnectId);

      // If onboarding is complete, return error
      if (status.chargesEnabled && status.detailsSubmitted) {
        return badRequest("Stripe Connect account is already fully connected");
      }

      // If onboarding is not complete, create new onboarding link
      const onboardingUrl = await createConnectOnboardingLink(
        vendor.stripeConnectId,
        id
      );

      return success({ onboardingUrl });
    }

    // No Stripe Connect account yet - create one
    const userWithEmail = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true },
    });

    if (!userWithEmail || !userWithEmail.email) {
      return badRequest("User email not found");
    }

    // Create Stripe Connect account
    const accountId = await createConnectAccount(userWithEmail.email, id);

    // Update vendor with Stripe Connect account ID
    await prisma.vendorProfile.update({
      where: { id },
      data: { stripeConnectId: accountId },
    });

    // Create onboarding link
    const onboardingUrl = await createConnectOnboardingLink(accountId, id);

    return success({ onboardingUrl });
  } catch (error) {
    console.error("Error initiating Stripe Connect onboarding:", error);
    return serverError("Failed to initiate Stripe Connect onboarding");
  }
}
