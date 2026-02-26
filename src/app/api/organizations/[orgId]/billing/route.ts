// src/app/api/organizations/[orgId]/billing/route.ts
// GET current subscription for the organization

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/core/lib/prisma/prisma";   // adjust to your prisma path
import { PLANS } from "@/features/billing/lib/plans";
import { authOptions } from "@/core/lib/auth/authOptions";

type Params = { params: Promise<{ orgId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { orgId } = await params;

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Must be a member of the org to view billing
        const member = await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: session.user.id,
                    organizationId: orgId,
                },
            },
        });
        if (!member) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get or create a FREE subscription record
        let subscription = await prisma.organizationSubscription.findUnique({
            where: { organizationId: orgId },
        });

        if (!subscription) {
            subscription = await prisma.organizationSubscription.create({
                data: { organizationId: orgId, plan: "FREE", status: "ACTIVE" },
            });
        }

        const planDetails = PLANS[subscription.plan];

        return NextResponse.json({
            plan: subscription.plan,
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            currentPeriodEnd: subscription.stripeCurrentPeriodEnd,
            trialEndsAt: subscription.trialEndsAt,
            planDetails,
        });
    } catch (error) {
        console.error("[GET /billing]", error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}