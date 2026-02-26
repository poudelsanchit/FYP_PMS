// src/features/billing/lib/plans.ts
// Central plan definitions — keep in sync with your Stripe dashboard

export const PLANS = {
    FREE: {
        id: "FREE" as const,
        name: "Free",
        description: "For individuals and small teams just getting started",
        price: { monthly: 0, yearly: 0 },
        stripePriceId: { monthly: null, yearly: null }, // no Stripe price for free
        limits: {
            members: 3,
            projects: 2,
            storage: "100MB",
            docs: 10,
            meetingRooms: 1,
        },
        features: [
            "Up to 3 members",
            "2 projects",
            "10 docs",
            "1 meeting room",
            "100MB storage",
            "Basic Kanban board",
            "Community support",
        ],
        highlighted: false,
    },
    PREMIUM: {
        id: "PREMIUM" as const,
        name: "Premium",
        description: "For growing teams who need more power",
        price: { monthly: 12, yearly: 99 },
        stripePriceId: {
            monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID!,
            yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID!,
        },
        limits: {
            members: 20,
            projects: 20,
            storage: "10GB",
            docs: -1, // unlimited
            meetingRooms: 10,
        },
        features: [
            "Up to 20 members",
            "20 projects",
            "Unlimited docs",
            "10 meeting rooms",
            "10GB storage",
            "Priority & label management",
            "Video conferencing (LiveKit)",
            "Email support",
        ],
        highlighted: true,
    },
    ENTERPRISE: {
        id: "ENTERPRISE" as const,
        name: "Enterprise",
        description: "For large organizations with custom needs",
        price: { monthly: 39, yearly: 349 },
        stripePriceId: {
            monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID!,
            yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID!,
        },
        limits: {
            members: -1, // unlimited
            projects: -1,
            storage: "100GB",
            docs: -1,
            meetingRooms: -1,
        },
        features: [
            "Unlimited members",
            "Unlimited projects",
            "Unlimited docs",
            "Unlimited meeting rooms",
            "100GB storage",
            "Custom roles & permissions",
            "SSO / SAML (coming soon)",
            "Dedicated Slack support",
            "SLA guarantee",
            "Custom onboarding",
        ],
        highlighted: false,
    },
} as const;

export type PlanId = keyof typeof PLANS;

// Lookup plan by Stripe price ID
export function getPlanByPriceId(priceId: string): PlanId | null {
    for (const [planId, plan] of Object.entries(PLANS)) {
        if (
            plan.stripePriceId &&
            "monthly" in plan.stripePriceId &&
            (plan.stripePriceId.monthly === priceId ||
                plan.stripePriceId.yearly === priceId)
        ) {
            return planId as PlanId;
        }
    }
    return null;
}