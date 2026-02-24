'use client'

import Image from 'next/image'
import { useDraggable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { cn } from '@/core/utils/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/core/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/core/components/ui/tooltip'
import type { Issue } from '../types/types'

interface IssueCardProps {
  issue: Issue
  onClick: () => void
  isDragOverlay?: boolean
}

// ─── Assignee Avatars ─────────────────────────────────────────────────────────

function AssigneeStack({ assignees }: { assignees: Issue['assignees'] }) {
  if (!assignees || assignees.length === 0) return null

  const visible = assignees.slice(0, 3)
  const overflow = assignees.length - 3
  const overflowAssignees = assignees.slice(3)

  return (
    <TooltipProvider>
      <div className="flex -space-x-1.5">
        {visible.map(a => (
          <Tooltip key={a.userId}>
            <TooltipTrigger asChild>
              <Avatar className="h-5 w-5 border-[1.5px] border-card cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                <AvatarImage
                  src={a.user.avatar ?? undefined}
                  alt={a.user.name ?? ''}
                />
                <AvatarFallback className="text-[8px] font-semibold uppercase">
                  {a.user.name?.[0] ?? '?'}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {a.user.name ?? 'Unknown'}
            </TooltipContent>
          </Tooltip>
        ))}
        {overflow > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-5 w-5 rounded-full border-[1.5px] border-card bg-muted flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                <span className="text-[8px] font-medium text-muted-foreground leading-none">
                  +{overflow}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <div className="space-y-1">
                {overflowAssignees.map(a => (
                  <div key={a.userId}>{a.user.name ?? 'Unknown'}</div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
// ─── Label Chip ───────────────────────────────────────────────────────────────

function LabelChip({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium leading-none border"
      style={{
        backgroundColor: `${color}18`,
        color,
        borderColor: `${color}30`,
      }}
    >
      {name}
    </span>
  )
}

// ─── Priority Chip ────────────────────────────────────────────────────────────

function PriorityChip({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium leading-none border"
      style={{
        backgroundColor: `${color}18`,
        color,
        borderColor: `${color}30`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  )
}

// ─── Card Content ─────────────────────────────────────────────────────────────

function CardContent({ issue }: { issue: Issue }) {
  const hasChips = issue.label || issue.priority
  const hasAssignees = issue.assignees && issue.assignees.length > 0
  const hasDueDate = !!issue.dueDate

  // Check if due date is overdue
  const isDueToday = hasDueDate && issue.dueDate && new Date(issue.dueDate).toDateString() === new Date().toDateString()
  const isOverdue = hasDueDate && issue.dueDate && new Date(issue.dueDate) < new Date() && !isDueToday

  return (
    <div className="flex flex-col gap-2.5 p-3">

      {/* Chips row */}
      {hasChips && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {issue.label && (
            <LabelChip name={issue.label.name} color={issue.label.color} />
          )}
          {issue.priority && (
            <PriorityChip name={issue.priority.name} color={issue.priority.color} />
          )}
        </div>
      )}

      {/* Title */}
      <p className="text-sm font-medium leading-snug text-foreground line-clamp-2">
        {issue.title}
      </p>

      {/* Footer: due date and assignees */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-2">
          {hasDueDate && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-medium",
                isOverdue
                  ? "text-red-600 dark:text-red-400"
                  : isDueToday
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-muted-foreground"
              )}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {issue.dueDate && new Date(issue.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {hasAssignees && <AssigneeStack assignees={issue.assignees} />}
        </div>
        {!hasAssignees && !hasDueDate && (
          <span className="text-[10px] text-muted-foreground/40 select-none">
            Unassigned
          </span>
        )}
      </div>

    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function IssueCard({ issue, onClick, isDragOverlay = false }: IssueCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: issue.id,
    data: { issue, sourceColumnId: issue.columnId },
  })

  if (isDragOverlay) {
    return (
      <div className="rounded-lg border border-border bg-card shadow-xl rotate-1 scale-[1.02] cursor-grabbing select-none opacity-95">
        <CardContent issue={issue} />
      </div>
    )
  }

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      layout="position"
      initial={false}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ layout: { duration: 0.18, ease: 'easeOut' } }}
      style={{
        visibility: isDragging ? 'hidden' : 'visible',
      }}
      onClick={isDragging ? undefined : onClick}
      className={cn(
        // Base
        'group relative rounded-lg border border-border bg-card',
        // Subtle left accent on hover using a pseudo-like approach
        'transition-all duration-150',
        // Hover
        'hover:border-border/80 hover:shadow-sm hover:bg-accent/30',
        // Cursor
        'select-none cursor-grab active:cursor-grabbing',
      )}
    >
      <CardContent issue={issue} />
    </motion.div>
  )
}
