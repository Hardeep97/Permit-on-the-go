import { NextRequest } from "next/server";
import { getStripe, createOrRetrieveStripeCustomer, PLANS } from "@/lib/stripe";
import {
  getAuthenticatedUser,
  unauthorized,
  success,
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

    const checkoutSession = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: PLANS.ANNUAL.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?subscription=cancelled`,
      metadata: {
        userId: user.id,
      },
    });

    return success({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return serverError("Failed to create checkout session");
  }
}
