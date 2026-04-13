'use client'

import { formatDistanceToNow } from 'date-fns'
import { IssueActivityType } from '@/generated/prisma/enums'
import { cn } from '@/core/utils/utils'

interface Activity {
  id: string
  type: IssueActivityType
  oldValue?: string | null
  newValue?: string | null
  createdAt: Date
}

interface ActivityLogProps {
  activities: Activity[]
  labels?: Record<string, { name: string; color: string }>
  priorities?: Record<string, { name: string; color: string }>
  columns?: Record<string, { name: string }>
}

const ACTIVITY_LABELS: Record<IssueActivityType, string> = {
  CREATED: 'Created issue',
  STATUS_CHANGED: 'Changed status',
  PRIORITY_CHANGED: 'Changed priority',
  LABEL_CHANGED: 'Changed label',
  ASSIGNEE_ADDED: 'Added assignee',
  ASSIGNEE_REMOVED: 'Removed assignee',
  TITLE_CHANGED: 'Changed title',
  DESCRIPTION_CHANGED: 'Changed description',
  DUE_DATE_CHANGED: 'Changed due date',
}

export function ActivityLog({ activities, labels = {}, priorities = {}, columns = {} }: ActivityLogProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        No activity yet
      </div>
    )
  }

  const getActivityDescription = (activity: Activity): string => {
    switch (activity.type) {
      case 'CREATED':
        return 'Created this issue'
      case 'STATUS_CHANGED':
        const oldStatus = activity.oldValue ? columns[activity.oldValue]?.name || activity.oldValue : 'Unknown'
        const newStatus = activity.newValue ? columns[activity.newValue]?.name || activity.newValue : 'Unknown'
        return `Changed status from ${oldStatus} to ${newStatus}`
      case 'PRIORITY_CHANGED':
        const oldPriority = activity.oldValue ? priorities[activity.oldValue]?.name || activity.oldValue : 'None'
        const newPriority = activity.newValue ? priorities[activity.newValue]?.name || activity.newValue : 'None'
        return `Changed priority from ${oldPriority} to ${newPriority}`
      case 'LABEL_CHANGED':
        const oldLabel = activity.oldValue ? labels[activity.oldValue]?.name || activity.oldValue : 'None'
        const newLabel = activity.newValue ? labels[activity.newValue]?.name || activity.newValue : 'None'
        return `Changed label from ${oldLabel} to ${newLabel}`
      case 'TITLE_CHANGED':
        return `Changed title to "${activity.newValue}"`
      case 'DESCRIPTION_CHANGED':
        return 'Updated description'
      case 'DUE_DATE_CHANGED':
        return `Changed due date to ${activity.newValue ? new Date(activity.newValue).toLocaleDateString() : 'None'}`
      case 'ASSIGNEE_ADDED':
        return `Added assignee: ${activity.newValue}`
      case 'ASSIGNEE_REMOVED':
        return `Removed assignee: ${activity.oldValue}`
      default:
        return ACTIVITY_LABELS[activity.type] || 'Unknown activity'
    }
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex gap-3 text-sm">
          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-muted-foreground/40 mt-2" />
          <div className="flex-1 min-w-0">
            <p className="text-foreground/80">
              {getActivityDescription(activity)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
