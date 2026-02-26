// src/app/api/organizations/[orgId]/billing/checkout/route.ts
// POST — creates a Stripe Checkout session and returns the URL
// Only ORG_ADMIN can initiate checkout

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/core/lib/prisma/prisma";
import { stripe } from "@/features/billing/lib/stripe";
import { PLANS, type PlanId } from "@/features/billing/lib/plans";
import { authOptions } from "@/core/lib/auth/authOptions";

type Params = { params: Promise<{ orgId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { orgId } = await params;

        // ── Auth ──────────────────────────────────────────────────────────────
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const member = await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: session.user.id,
                    organizationId: orgId,
                },
            },
        });

        if (member?.role !== "ORG_ADMIN") {
            return NextResponse.json(
                { error: "Only organization admins can manage billing" },
                { status: 403 }
            );
        }

        // ── Validate request body ─────────────────────────────────────────────
        const body = await req.json();
        const { planId, billingCycle } = body as {
            planId: PlanId;
            billingCycle: "monthly" | "yearly";
        };

        if (!planId || !PLANS[planId]) {
            return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
        }

        if (planId === "FREE") {
            return NextResponse.json(
                { error: "Cannot checkout to free plan — use the downgrade endpoint" },
                { status: 400 }
            );
        }

        const plan = PLANS[planId];
        const priceId = plan.stripePriceId[billingCycle ?? "monthly"];

        if (!priceId) {
            return NextResponse.json(
                { error: "Stripe price ID not configured for this plan" },
                { status: 500 }
            );
        }

        // ── Get or create Stripe customer ─────────────────────────────────────
        let subscription = await prisma.organizationSubscription.findUnique({
            where: { organizationId: orgId },
        });

        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: { name: true },
        });

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { email: true, name: true },
        });

        let stripeCustomerId = subscription?.stripeCustomerId;

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user!.email,
                name: org?.name ?? undefined,
                metadata: { organizationId: orgId },
            });
            stripeCustomerId = customer.id;
        }

        // ── Create Checkout session ────────────────────────────────────────────
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

        console.log("[Checkout] Creating session for:", {
            orgId,
            planId,
            billingCycle,
            priceId,
            customerId: stripeCustomerId,
        });

        const checkoutSession = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${baseUrl}/app/${orgId}?billing=success`,
            cancel_url: `${baseUrl}/app/${orgId}?billing=canceled`,
            subscription_data: {
                metadata: {
                    organizationId: orgId,
                    planId,
                },
            },
            metadata: {
                organizationId: orgId,
                planId,
            },
            allow_promotion_codes: true,
            billing_address_collection: "auto",
        });

        console.log("[Checkout] Session created:", checkoutSession.id);

        // DEMO MODE: Update plan immediately (before payment)
        // In production, this would be done by the webhook after payment
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

        await prisma.organizationSubscription.upsert({
            where: { organizationId: orgId },
            update: { 
                stripeCustomerId,
                plan: planId as "FREE" | "PREMIUM" | "ENTERPRISE", // Update plan immediately
                status: "ACTIVE",
                stripeCurrentPeriodEnd: currentPeriodEnd,
            },
            create: {
                organizationId: orgId,
                plan: planId as "FREE" | "PREMIUM" | "ENTERPRISE", // Set plan immediately
                status: "ACTIVE",
                stripeCustomerId,
                stripeCurrentPeriodEnd: currentPeriodEnd,
            },
        });

        console.log("[Checkout] Plan updated to", planId, "for demo purposes");

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error) {
        console.error("[POST /billing/checkout]", error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}