'use client';

import { useCallback } from 'react';
import { OrgLimits, hasReachedLimit } from './useBillingLimits';

/**
 * Hook to check if an action is allowed based on limits
 * Returns a function that checks the limit and optionally shows a toast
 */
export function useCheckLimit(limits: OrgLimits | null) {
  const canPerformAction = useCallback(
    (resource: keyof OrgLimits['limits']): { allowed: boolean; message?: string } => {
      if (!limits) {
        return { allowed: true }; // Allow if limits not loaded yet
      }

      if (hasReachedLimit(limits, resource)) {
        const resourceLabel = {
          members: 'members',
          projects: 'projects',
          docs: 'documents',
          meetingRooms: 'meeting rooms',
        }[resource];

        return {
          allowed: false,
          message: `You've reached the ${resourceLabel} limit for your ${limits.plan} plan. Please upgrade to continue.`,
        };
      }

      return { allowed: true };
    },
    [limits]
  );

  return { canPerformAction };
}
