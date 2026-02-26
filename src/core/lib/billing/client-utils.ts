/**
 * Client-side billing utilities for common patterns
 */

import { OrgLimits } from '@/core/hooks/useBillingLimits';

/**
 * Format a limit display string
 * Examples: "3 / 10", "5 / ∞", "Unlimited"
 */
export function formatLimitDisplay(current: number, limit: number): string {
  if (limit === -1) return 'Unlimited';
  return `${current} / ${limit}`;
}

/**
 * Get a user-friendly resource name
 */
export function getResourceLabel(resource: keyof OrgLimits['limits']): string {
  const labels: Record<keyof OrgLimits['limits'], string> = {
    members: 'Members',
    projects: 'Projects',
    docs: 'Documents',
    meetingRooms: 'Meeting Rooms',
  };
  return labels[resource];
}

/**
 * Get a user-friendly action description
 */
export function getActionDescription(resource: keyof OrgLimits['limits']): string {
  const actions: Record<keyof OrgLimits['limits'], string> = {
    members: 'invite a member',
    projects: 'create a project',
    docs: 'create a document',
    meetingRooms: 'create a meeting room',
  };
  return actions[resource];
}

/**
 * Get upgrade recommendation based on current usage
 */
export function getUpgradeRecommendation(limits: OrgLimits): string | null {
  const resources = Object.entries(limits.limits) as Array<
    [keyof OrgLimits['limits'], OrgLimits['limits'][keyof OrgLimits['limits']]]
  >;

  for (const [resource, limit] of resources) {
    if (limit.unlimited) continue;

    const percentage = (limit.current / limit.limit) * 100;

    if (percentage >= 90) {
      return `You're using ${Math.round(percentage)}% of your ${getResourceLabel(resource).toLowerCase()} limit. Consider upgrading your plan.`;
    }
  }

  return null;
}

/**
 * Check if organization should show upgrade prompt
 */
export function shouldShowUpgradePrompt(limits: OrgLimits): boolean {
  if (limits.plan === 'ENTERPRISE') return false;

  const resources = Object.entries(limits.limits) as Array<
    [keyof OrgLimits['limits'], OrgLimits['limits'][keyof OrgLimits['limits']]]
  >;

  for (const [, limit] of resources) {
    if (limit.unlimited) continue;
    const percentage = (limit.current / limit.limit) * 100;
    if (percentage >= 80) return true;
  }

  return false;
}

/**
 * Get all resources that are near their limit (80%+)
 */
export function getNearLimitResources(limits: OrgLimits): Array<keyof OrgLimits['limits']> {
  const resources = Object.entries(limits.limits) as Array<
    [keyof OrgLimits['limits'], OrgLimits['limits'][keyof OrgLimits['limits']]]
  >;

  return resources
    .filter(([, limit]) => {
      if (limit.unlimited) return false;
      const percentage = (limit.current / limit.limit) * 100;
      return percentage >= 80;
    })
    .map(([resource]) => resource);
}

/**
 * Get all resources that have reached their limit
 */
export function getMaxedOutResources(limits: OrgLimits): Array<keyof OrgLimits['limits']> {
  const resources = Object.entries(limits.limits) as Array<
    [keyof OrgLimits['limits'], OrgLimits['limits'][keyof OrgLimits['limits']]]
  >;

  return resources
    .filter(([, limit]) => {
      if (limit.unlimited) return false;
      return limit.current >= limit.limit;
    })
    .map(([resource]) => resource);
}
