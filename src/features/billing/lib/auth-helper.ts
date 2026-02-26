// src/features/billing/lib/auth-helper.ts
// Reusable helper to get the current user in API routes using NextAuth

import { authOptions } from "@/core/lib/auth/authOptions";
import { prisma } from "@/core/lib/prisma/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function requireAuth(): Promise<
    | { userId: string; error: null }
    | { userId: null; error: NextResponse }
> {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return {
            userId: null,
            error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        };
    }

    return { userId: session.user.id, error: null };
}

// Verify user is ORG_ADMIN of the given org
export async function requireOrgAdmin(
    userId: string,
    orgId: string,
): Promise<boolean> {
    const member = await prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    return member?.role === "ORG_ADMIN";
}