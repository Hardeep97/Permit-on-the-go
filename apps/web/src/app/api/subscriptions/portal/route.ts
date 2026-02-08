import { NextRequest } from "next/server";
import { getStripe, createOrRetrieveStripeCustomer } from "@/lib/stripe";
import {
  getAuthenticatedUser,
  unauthorized,
  success,
  badRequest,
  serverError,
} from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const customerId = await createOrRetrieveStripeCustomer(
      user.id,
      user.email,
      user.name
    );

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard/settings`,
    });

    return success({ url: portalSession.url });
  } catch (error) {
    console.error("Portal error:", error);
    return serverError("Failed to create billing portal session");
  }
}
