// src/app/api/stripe/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/features/billing/lib/stripe";
import { prisma } from "@/core/lib/prisma/prisma";
import { getPlanByPriceId } from "@/features/billing/lib/plans";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
        return NextResponse.json(
            { error: "Missing stripe-signature or webhook secret" },
            { status: 400 }
        );
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
        console.error("[Webhook] Signature verification failed:", err);
        return NextResponse.json(
            { error: "Webhook signature verification failed" },
            { status: 400 }
        );
    }

    console.log(`[Webhook] Received: ${event.type}`);

    try {
        switch (event.type) {

            // ── Checkout completed ─────────────────────────────────────────────
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                console.log("[Webhook] Checkout session completed:", {
                    mode: session.mode,
                    customer: session.customer,
                    subscription: session.subscription,
                    metadata: session.metadata,
                });

                if (session.mode !== "subscription") {
                    console.log("[Webhook] Skipping non-subscription checkout");
                    break;
                }

                const orgId = session.metadata?.organizationId;
                const planId = session.metadata?.planId;
                
                if (!orgId || !planId) {
                    console.error("[Webhook] Missing metadata:", { orgId, planId });
                    break;
                }

                console.log("[Webhook] Processing subscription for org:", orgId, "plan:", planId);

                // Retrieve full subscription object
                const sub = await stripe.subscriptions.retrieve(
                    session.subscription as string
                );

                // sub is Stripe.Response<Stripe.Subscription> which extends Stripe.Subscription
                // Cast through unknown to access the fields TypeScript complains about in beta API types
                const subData = sub as unknown as Stripe.Subscription & {
                    current_period_end: number;
                    cancel_at_period_end: boolean;
                };

                console.log("[Webhook] Subscription data:", {
                    id: subData.id,
                    status: subData.status,
                    priceId: subData.items.data[0]?.price.id,
                    currentPeriodEnd: subData.current_period_end,
                });

                await prisma.organizationSubscription.upsert({
                    where: { organizationId: orgId },
                    update: {
                        plan: planId as "FREE" | "PREMIUM" | "ENTERPRISE",
                        status: mapStripeStatus(subData.status),
                        stripeSubscriptionId: subData.id,
                        stripeCustomerId: session.customer as string,
                        stripePriceId: subData.items.data[0]?.price.id ?? null,
                        stripeCurrentPeriodEnd: new Date(subData.current_period_end * 1000),
                        cancelAtPeriodEnd: subData.cancel_at_period_end,
                    },
                    create: {
                        organizationId: orgId,
                        plan: planId as "FREE" | "PREMIUM" | "ENTERPRISE",
                        status: mapStripeStatus(subData.status),
                        stripeSubscriptionId: subData.id,
                        stripeCustomerId: session.customer as string,
                        stripePriceId: subData.items.data[0]?.price.id ?? null,
                        stripeCurrentPeriodEnd: new Date(subData.current_period_end * 1000),
                        cancelAtPeriodEnd: subData.cancel_at_period_end,
                    },
                });

                console.log("[Webhook] Successfully updated subscription for org:", orgId);
                break;
            }

            // ── Subscription updated ───────────────────────────────────────────
            case "customer.subscription.updated": {
                const sub = event.data.object as unknown as Stripe.Subscription & {
                    current_period_end: number;
                    cancel_at_period_end: boolean;
                };

                const orgId = sub.metadata?.organizationId;

                const existing = await prisma.organizationSubscription.findFirst({
                    where: orgId
                        ? { organizationId: orgId }
                        : { stripeSubscriptionId: sub.id },
                });
                if (!existing) break;

                const priceId = sub.items.data[0]?.price.id;
                const planId = priceId ? getPlanByPriceId(priceId) : null;

                await prisma.organizationSubscription.update({
                    where: { id: existing.id },
                    data: {
                        plan: planId ?? "FREE",
                        status: mapStripeStatus(sub.status),
                        stripePriceId: priceId ?? null,
                        stripeCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
                        cancelAtPeriodEnd: sub.cancel_at_period_end,
                    },
                });
                break;
            }

            // ── Subscription deleted ───────────────────────────────────────────
            case "customer.subscription.deleted": {
                const sub = event.data.object as Stripe.Subscription;

                const existing = await prisma.organizationSubscription.findFirst({
                    where: { stripeSubscriptionId: sub.id },
                });
                if (!existing) break;

                await prisma.organizationSubscription.update({
                    where: { id: existing.id },
                    data: {
                        plan: "FREE",
                        status: "CANCELED",
                        stripeSubscriptionId: null,
                        stripePriceId: null,
                        stripeCurrentPeriodEnd: null,
                        cancelAtPeriodEnd: false,
                    },
                });
                break;
            }

            // ── Invoice payment succeeded ──────────────────────────────────────
            case "invoice.payment_succeeded": {
                const invoice = event.data.object as Stripe.Invoice;

                // In stable API versions invoice.subscription is a string ID.
                // In beta (acacia) API it moved to invoice.parent — handle both.
                const subId: string | null =
                    (invoice as unknown as Record<string, unknown>).subscription as string | null
                    ?? (invoice as unknown as Record<string, unknown>).parent as string | null
                    ?? null;

                if (!subId) break;

                const sub = await stripe.subscriptions.retrieve(subId) as unknown as Stripe.Subscription & {
                    current_period_end: number;
                };

                await prisma.organizationSubscription.updateMany({
                    where: { stripeSubscriptionId: subId },
                    data: {
                        status: "ACTIVE",
                        stripeCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
                    },
                });
                break;
            }

            // ── Invoice payment failed ─────────────────────────────────────────
            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;

                const subId: string | null =
                    (invoice as unknown as Record<string, unknown>).subscription as string | null
                    ?? (invoice as unknown as Record<string, unknown>).parent as string | null
                    ?? null;

                if (!subId) break;

                await prisma.organizationSubscription.updateMany({
                    where: { stripeSubscriptionId: subId },
                    data: { status: "PAST_DUE" },
                });
                break;
            }

            default:
                console.log(`[Webhook] Unhandled event type: ${event.type}`);
        }
    } catch (error) {
        console.error(`[Webhook] Error processing ${event.type}:`, error);
    }

    return NextResponse.json({ received: true });
}

// ─── Map Stripe status → DB enum ─────────────────────────────────────────────

function mapStripeStatus(
    status: Stripe.Subscription.Status
): "ACTIVE" | "CANCELED" | "PAST_DUE" | "TRIALING" | "INCOMPLETE" | "UNPAID" {
    const map: Record<
        Stripe.Subscription.Status,
        "ACTIVE" | "CANCELED" | "PAST_DUE" | "TRIALING" | "INCOMPLETE" | "UNPAID"
    > = {
        active: "ACTIVE",
        canceled: "CANCELED",
        past_due: "PAST_DUE",
        trialing: "TRIALING",
        incomplete: "INCOMPLETE",
        incomplete_expired: "CANCELED",
        unpaid: "UNPAID",
        paused: "CANCELED",
    };
    return map[status] ?? "ACTIVE";
}