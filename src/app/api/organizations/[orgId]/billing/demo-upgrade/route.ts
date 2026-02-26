// src/app/api/organizations/[orgId]/billing/demo-upgrade/route.ts
// POST — Demo mode: instantly upgrade plan without Stripe payment
// For demonstration purposes only

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/core/lib/prisma/prisma";
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
        const { planId } = body as { planId: PlanId };

        if (!planId || !PLANS[planId]) {
            return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
        }

        console.log("[Demo Upgrade] Upgrading org", orgId, "to plan", planId);

        // ── Update subscription immediately ───────────────────────────────────
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // 1 month from now

        await prisma.organizationSubscription.upsert({
            where: { organizationId: orgId },
            update: {
                plan: planId as "FREE" | "PREMIUM" | "ENTERPRISE",
                status: "ACTIVE",
                stripeCurrentPeriodEnd: currentPeriodEnd,
                cancelAtPeriodEnd: false,
            },
            create: {
                organizationId: orgId,
                plan: planId as "FREE" | "PREMIUM" | "ENTERPRISE",
                status: "ACTIVE",
                stripeCurrentPeriodEnd: currentPeriodEnd,
                cancelAtPeriodEnd: false,
            },
        });

        console.log("[Demo Upgrade] Successfully upgraded to", planId);

        return NextResponse.json({ 
            success: true,
            plan: planId,
            message: "Plan upgraded successfully (demo mode)"
        });
    } catch (error) {
        console.error("[POST /billing/demo-upgrade]", error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
