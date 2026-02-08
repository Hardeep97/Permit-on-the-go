import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@permits/database";

export async function POST(request: NextRequest) {
  const stripe = getStripe();

  const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_CONNECT_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;

      // Find vendor by Stripe Connect account ID
      const vendor = await prisma.vendorProfile.findFirst({
        where: { stripeConnectId: account.id },
      });

      if (vendor && account.charges_enabled && account.details_submitted) {
        await prisma.vendorProfile.update({
          where: { id: vendor.id },
          data: { isVerified: true },
        });
        console.log(`Vendor ${vendor.id} verified via Stripe Connect`);
      }
    }

    // Handle transfer events by looking up by description or metadata
    if (event.type === "transfer.created" || event.type === "transfer.reversed") {
      const transfer = event.data.object as Stripe.Transfer;

      const transaction = await prisma.vendorTransaction.findFirst({
        where: { stripePaymentId: transfer.id },
      });

      if (transaction) {
        const status = event.type === "transfer.reversed" ? "FAILED" : "COMPLETED";
        await prisma.vendorTransaction.update({
          where: { id: transaction.id },
          data: { status },
        });
        console.log(`Transaction ${transaction.id} marked as ${status}`);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
