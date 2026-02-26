'use client';

import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { OrgLimits, hasReachedLimit, getRemainingCount } from '@/core/hooks/useBillingLimits';

interface LimitWarningProps {
  limits: OrgLimits | null;
  resource: keyof OrgLimits['limits'];
  action?: string; // e.g., "create a project", "invite a member"
}

export function LimitWarning({ limits, resource, action }: LimitWarningProps) {
  if (!limits) return null;

  const hasReached = hasReachedLimit(limits, resource);
  const remaining = getRemainingCount(limits, resource);

  if (!hasReached) return null;

  const resourceLabel = {
    members: 'members',
    projects: 'projects',
    docs: 'documents',
    meetingRooms: 'meeting rooms',
  }[resource];

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        You've reached the {resourceLabel} limit for your {limits.plan} plan. 
        {action && ` You cannot ${action}.`}
        {' '}
        <a href="/app/billing" className="underline font-semibold hover:no-underline">
          Upgrade your plan
        </a>
        {' '}to increase limits.
      </AlertDescription>
    </Alert>
  );
}

interface LimitProgressProps {
  limits: OrgLimits | null;
  resource: keyof OrgLimits['limits'];
  showLabel?: boolean;
}

export function LimitProgress({ limits, resource, showLabel = true }: LimitProgressProps) {
  if (!limits) return null;

  const limit = limits.limits[resource];
  const percentage = limit.unlimited ? 0 : Math.round((limit.current / limit.limit) * 100);

  const resourceLabel = {
    members: 'Members',
    projects: 'Projects',
    docs: 'Documents',
    meetingRooms: 'Meeting Rooms',
  }[resource];

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="font-medium">{resourceLabel}</span>
          <span className="text-muted-foreground">
            {limit.current} {limit.unlimited ? '/ ∞' : `/ ${limit.limit}`}
          </span>
        </div>
      )}
      {!limit.unlimited && (
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-colors ${
              percentage >= 90 ? 'bg-destructive' : percentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
