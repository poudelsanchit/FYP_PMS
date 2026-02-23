'use client'

import { useDraggable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { User2 } from 'lucide-react'
import type { Issue } from '../types/types'

interface IssueCardProps {
  issue: Issue
  onClick: () => void
  isDragOverlay?: boolean
}

const CardContent = ({ issue }: { issue: Issue }) => (
  <div className="px-3 py-3">
    {(issue.label || issue.priority) && (
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        {issue.label && (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium leading-none"
            style={{
              backgroundColor: issue.label.color + '22',
              color: issue.label.color,
              border: `1px solid ${issue.label.color}44`,
            }}
          >
            {issue.label.name}
          </span>
        )}
        {issue.priority && (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium leading-none"
            style={{
              backgroundColor: issue.priority.color + '18',
              color: issue.priority.color,
              border: `1px solid ${issue.priority.color}33`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: issue.priority.color }}
            />
            {issue.priority.name}
          </span>
        )}
      </div>
    )}
    <p className="text-sm font-medium leading-snug text-foreground line-clamp-3 mb-2">
      {issue.title}
    </p>
    {issue.assignees && issue.assignees.length > 0 && (
      <div className="flex items-center gap-1 mt-2">
        <div className="flex -space-x-1.5">
          {issue.assignees.slice(0, 3).map(a =>
            a.user.avatar ? (
              <img
                key={a.userId}
                src={a.user.avatar}
                alt={a.user.name}
                className="w-5 h-5 rounded-full border-2 border-card object-cover"
                title={a.user.name}
              />
            ) : (
              <div
                key={a.userId}
                className="w-5 h-5 rounded-full border-2 border-card bg-muted flex items-center justify-center"
                title={a.user.name}
              >
                <span className="text-[8px] font-semibold text-muted-foreground uppercase">
                  {a.user.name?.[0] ?? '?'}
                </span>
              </div>
            )
          )}
          {issue.assignees.length > 3 && (
            <div className="w-5 h-5 rounded-full border-2 border-card bg-muted flex items-center justify-center">
              <span className="text-[8px] font-medium text-muted-foreground">
                +{issue.assignees.length - 3}
              </span>
            </div>
          )}
        </div>
      </div>
    )}
    {(!issue.assignees || issue.assignees.length === 0) && (
      <div className="flex items-center gap-1 mt-1">
        <User2 className="w-3 h-3 text-muted-foreground/30" />
        <span className="text-[10px] text-muted-foreground/40">Unassigned</span>
      </div>
    )}
  </div>
)

export function IssueCard({ issue, onClick, isDragOverlay = false }: IssueCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: issue.id,
    data: { issue, sourceColumnId: issue.columnId },
  })

  if (isDragOverlay) {
    return (
      <div
        className="group relative rounded-xl border bg-card text-card-foreground shadow-2xl rotate-[1.5deg] scale-[1.03] cursor-grabbing select-none"
      >
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
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        layout: { duration: 0.2, ease: 'easeOut' },
      }}
      // KEY FIX: Use CSS visibility instead of animating opacity.
      // visibility:hidden keeps the element in the layout (preserves the gap/placeholder)
      // but makes it invisible. It flips instantly — no async animation state involved.
      style={{
        visibility: isDragging ? 'hidden' : 'visible',
        zIndex: isDragging ? 1000 : undefined,
      }}
      className={[
        'group relative rounded-xl border bg-card text-card-foreground',
        'shadow-sm hover:shadow-md transition-shadow duration-200',
        'select-none cursor-grab active:cursor-grabbing',
      ].join(' ')}
      onClick={isDragging ? undefined : onClick}
    >
      <CardContent issue={issue} />
    </motion.div>
  )
}