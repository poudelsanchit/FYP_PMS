/**
 * GET /api/organizations/[orgId]/limits
 * Returns the current usage and limits for the organization
 */

import { NextRequest } from "next/server";
import { getAuthUserId, err, ok } from "@/core/lib/api/api";
import { prisma } from "@/core/lib/prisma/prisma";
import { getOrgLimits } from "@/core/lib/billing/limits";

interface Context {
  params: Promise<{ orgId: string }>;
}

export async function GET(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { orgId } = await params;

  // Verify user is a member of the organization
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });

  if (!membership) return err("Forbidden", 403);

  try {
    const limits = await getOrgLimits(orgId);
    return ok(limits);
  } catch (error) {
    console.error("Error fetching organization limits:", error);
    return err("Failed to fetch limits", 500);
  }
}
