import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@permits/database";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (!userId) break;

        await prisma.subscription.upsert({
          where: { userId },
          update: {
            plan: "ANNUAL",
            status: "ACTIVE",
            stripeSubscriptionId: session.subscription as string,
            aiCreditsRemaining: 999999, // Unlimited for annual
            aiCreditsTotal: 999999,
          },
          create: {
            userId,
            plan: "ANNUAL",
            status: "ACTIVE",
            stripeSubscriptionId: session.subscription as string,
            aiCreditsRemaining: 999999,
            aiCreditsTotal: 999999,
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const sub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (!sub) break;

        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: subscription.status === "active" ? "ACTIVE" : "PAST_DUE",
            currentPeriodStart: new Date(
              subscription.current_period_start * 1000
            ),
            currentPeriodEnd: new Date(
              subscription.current_period_end * 1000
            ),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const sub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (!sub) break;

        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            plan: "FREE",
            status: "CANCELLED",
            aiCreditsRemaining: 5,
            aiCreditsTotal: 5,
          },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;

        const sub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: invoice.subscription as string },
        });
        if (!sub) break;

        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "PAST_DUE" },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
