import { getStripe } from "./stripe";

const PLATFORM_FEE_PERCENT = 3;

/**
 * Create a Stripe Connect Express account for a vendor.
 */
export async function createConnectAccount(
  email: string,
  vendorId: string
): Promise<string> {
  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    email,
    metadata: { vendorId },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
  return account.id;
}

/**
 * Create an onboarding link that redirects the vendor through Stripe's Express setup.
 */
export async function createConnectOnboardingLink(
  accountId: string,
  vendorId: string
): Promise<string> {
  const stripe = getStripe();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/dashboard/vendor-portal?stripe=refresh`,
    return_url: `${baseUrl}/dashboard/vendor-portal?stripe=complete`,
    type: "account_onboarding",
  });
  return link.url;
}

/**
 * Create a login link so the vendor can access their Stripe Express dashboard.
 */
export async function createConnectLoginLink(accountId: string): Promise<string> {
  const stripe = getStripe();
  const link = await stripe.accounts.createLoginLink(accountId);
  return link.url;
}

/**
 * Get the status of a Connect account.
 */
export async function getConnectAccountStatus(accountId: string): Promise<{
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}> {
  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(accountId);
  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  };
}

/**
 * Create a transfer to a vendor's connected account with the platform fee withheld.
 * Amount is in cents.
 */
export async function createTransfer(
  connectedAccountId: string,
  amountCents: number,
  description?: string
): Promise<{ transferId: string; netAmount: number; platformFee: number }> {
  const stripe = getStripe();
  const platformFee = Math.round(amountCents * (PLATFORM_FEE_PERCENT / 100));
  const netAmount = amountCents - platformFee;

  const transfer = await stripe.transfers.create({
    amount: netAmount,
    currency: "usd",
    destination: connectedAccountId,
    description,
  });

  return {
    transferId: transfer.id,
    netAmount,
    platformFee,
  };
}
