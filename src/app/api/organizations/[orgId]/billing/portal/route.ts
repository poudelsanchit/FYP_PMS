// src/app/api/organizations/[orgId]/billing/portal/route.ts
// POST — creates a Stripe Customer Portal session so users can manage their sub
// (update card, cancel, view invoices, etc.)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/core/lib/prisma/prisma";
import { stripe } from "@/features/billing/lib/stripe";
import { authOptions } from "@/core/lib/auth/authOptions";

type Params = { params: Promise<{ orgId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { orgId } = await params;

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

        const subscription = await prisma.organizationSubscription.findUnique({
            where: { organizationId: orgId },
        });

        if (!subscription?.stripeCustomerId) {
            return NextResponse.json(
                { error: "No billing account found. Please subscribe first." },
                { status: 400 }
            );
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: `${baseUrl}/app/${orgId}/settings`,
        });

        return NextResponse.json({ url: portalSession.url });
    } catch (error) {
        console.error("[POST /billing/portal]", error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}