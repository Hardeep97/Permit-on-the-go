export const ORG_ROLES = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
} as const;

export type OrgRole = (typeof ORG_ROLES)[keyof typeof ORG_ROLES];

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

export const SUBSCRIPTION_PLANS = {
  FREE: "FREE",
  ANNUAL: "ANNUAL",
  ENTERPRISE: "ENTERPRISE",
} as const;

export type SubscriptionPlan =
  (typeof SUBSCRIPTION_PLANS)[keyof typeof SUBSCRIPTION_PLANS];

export const PLAN_DETAILS: Record<
  SubscriptionPlan,
  { name: string; price: number; description: string; features: string[] }
> = {
  FREE: {
    name: "Free Trial",
    price: 0,
    description: "Try it out with limited features",
    features: [
      "1 property",
      "5 AI chatbot questions",
      "Basic permit tracking",
      "Document uploads",
    ],
  },
  ANNUAL: {
    name: "Annual",
    price: 250,
    description: "Full access for landlords and expeditors",
    features: [
      "Unlimited properties",
      "Unlimited AI chatbot",
      "Subcode form filling",
      "Multi-party collaboration",
      "Vendor marketplace access",
      "Email automation",
      "Workflow templates",
      "Priority support",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 0, // Custom pricing
    description: "For expediting firms and property management companies",
    features: [
      "Everything in Annual",
      "Team management",
      "Custom workflows",
      "API access",
      "Dedicated support",
      "White-label options",
    ],
  },
};
