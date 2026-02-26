'use client';

import { useEffect, useState } from 'react';

export interface OrgLimits {
  plan: string;
  limits: {
    members: {
      current: number;
      limit: number;
      unlimited: boolean;
    };
    projects: {
      current: number;
      limit: number;
      unlimited: boolean;
    };
    docs: {
      current: number;
      limit: number;
      unlimited: boolean;
    };
    meetingRooms: {
      current: number;
      limit: number;
      unlimited: boolean;
    };
  };
}

export function useBillingLimits(orgId: string | undefined) {
  const [limits, setLimits] = useState<OrgLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const fetchLimits = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/organizations/${orgId}/limits`);
        if (!response.ok) {
          throw new Error('Failed to fetch limits');
        }
        const data = await response.json();
        setLimits(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLimits(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLimits();
  }, [orgId]);

  return { limits, loading, error };
}

/**
 * Check if a specific limit has been reached
 */
export function hasReachedLimit(limits: OrgLimits | null, resource: keyof OrgLimits['limits']): boolean {
  if (!limits) return false;
  const limit = limits.limits[resource];
  return !limit.unlimited && limit.current >= limit.limit;
}

/**
 * Get remaining count for a resource
 */
export function getRemainingCount(limits: OrgLimits | null, resource: keyof OrgLimits['limits']): number | null {
  if (!limits) return null;
  const limit = limits.limits[resource];
  if (limit.unlimited) return -1; // -1 means unlimited
  return limit.limit - limit.current;
}

/**
 * Get usage percentage for a resource
 */
export function getUsagePercentage(limits: OrgLimits | null, resource: keyof OrgLimits['limits']): number {
  if (!limits) return 0;
  const limit = limits.limits[resource];
  if (limit.unlimited) return 0;
  return Math.round((limit.current / limit.limit) * 100);
}
