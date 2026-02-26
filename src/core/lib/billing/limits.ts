/**
 * Billing limits utility
 * Checks organization tier limits for members, projects, docs, and meeting rooms
 */

import { prisma } from "@/core/lib/prisma/prisma";
import { PLANS, PlanId } from "@/features/billing/lib/plans";

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  message?: string;
}

/**
 * Get the organization's current plan tier
 */
export async function getOrgPlanTier(orgId: string): Promise<PlanId> {
  const subscription = await prisma.organizationSubscription.findUnique({
    where: { organizationId: orgId },
  });

  return subscription?.plan ?? "FREE";
}

/**
 * Check if organization has reached member limit
 */
export async function checkMemberLimit(orgId: string): Promise<LimitCheckResult> {
  const plan = await getOrgPlanTier(orgId);
  const planConfig = PLANS[plan];
  const limit = planConfig.limits.members;

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1 };
  }

  const currentCount = await prisma.organizationMember.count({
    where: { organizationId: orgId },
  });

  const allowed = currentCount < limit;

  return {
    allowed,
    current: currentCount,
    limit,
    message: allowed
      ? undefined
      : `Member limit reached. Your ${plan} plan allows ${limit} members. Current: ${currentCount}`,
  };
}

/**
 * Check if organization has reached project limit
 */
export async function checkProjectLimit(orgId: string): Promise<LimitCheckResult> {
  const plan = await getOrgPlanTier(orgId);
  const planConfig = PLANS[plan];
  const limit = planConfig.limits.projects;

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1 };
  }

  const currentCount = await prisma.project.count({
    where: { organizationId: orgId },
  });

  const allowed = currentCount < limit;

  return {
    allowed,
    current: currentCount,
    limit,
    message: allowed
      ? undefined
      : `Project limit reached. Your ${plan} plan allows ${limit} projects. Current: ${currentCount}`,
  };
}

/**
 * Check if organization has reached docs limit
 */
export async function checkDocsLimit(orgId: string): Promise<LimitCheckResult> {
  const plan = await getOrgPlanTier(orgId);
  const planConfig = PLANS[plan];
  const limit = planConfig.limits.docs;

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1 };
  }

  // Count all docs across all projects in the organization
  const currentCount = await prisma.doc.count({
    where: {
      project: {
        organizationId: orgId,
      },
    },
  });

  const allowed = currentCount < limit;

  return {
    allowed,
    current: currentCount,
    limit,
    message: allowed
      ? undefined
      : `Docs limit reached. Your ${plan} plan allows ${limit} docs. Current: ${currentCount}`,
  };
}

/**
 * Check if organization has reached meeting rooms limit
 */
export async function checkMeetingRoomsLimit(orgId: string): Promise<LimitCheckResult> {
  const plan = await getOrgPlanTier(orgId);
  const planConfig = PLANS[plan];
  const limit = planConfig.limits.meetingRooms;

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1 };
  }

  const currentCount = await prisma.meetingRoom.count({
    where: { organizationId: orgId },
  });

  const allowed = currentCount < limit;

  return {
    allowed,
    current: currentCount,
    limit,
    message: allowed
      ? undefined
      : `Meeting rooms limit reached. Your ${plan} plan allows ${limit} meeting rooms. Current: ${currentCount}`,
  };
}

/**
 * Get all limits for an organization (useful for frontend display)
 */
export async function getOrgLimits(orgId: string) {
  const plan = await getOrgPlanTier(orgId);
  const planConfig = PLANS[plan];

  const [members, projects, docs, meetingRooms] = await Promise.all([
    prisma.organizationMember.count({ where: { organizationId: orgId } }),
    prisma.project.count({ where: { organizationId: orgId } }),
    prisma.doc.count({
      where: {
        project: {
          organizationId: orgId,
        },
      },
    }),
    prisma.meetingRoom.count({ where: { organizationId: orgId } }),
  ]);

  return {
    plan,
    limits: {
      members: {
        current: members,
        limit: planConfig.limits.members,
        unlimited: planConfig.limits.members === -1,
      },
      projects: {
        current: projects,
        limit: planConfig.limits.projects,
        unlimited: planConfig.limits.projects === -1,
      },
      docs: {
        current: docs,
        limit: planConfig.limits.docs,
        unlimited: planConfig.limits.docs === -1,
      },
      meetingRooms: {
        current: meetingRooms,
        limit: planConfig.limits.meetingRooms,
        unlimited: planConfig.limits.meetingRooms === -1,
      },
    },
  };
}
