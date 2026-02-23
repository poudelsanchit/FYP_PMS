'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { GripVertical, User2 } from 'lucide-react'
import type { Issue } from '../types/types'

interface IssueCardProps {
  issue: Issue
  onClick: () => void
  isDragOverlay?: boolean
}

export function IssueCard({ issue, onClick, isDragOverlay = false }: IssueCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: issue.id,
    data: { issue, sourceColumnId: issue.columnId },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1000 : undefined,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={isDragOverlay ? undefined : style}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: isDragging ? 0.4 : 1, y: 0 }}
      exit={{ opacity: 0, y: -6, scale: 0.96 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={[
        'group relative rounded-xl border bg-card text-card-foreground',
        'shadow-sm hover:shadow-md transition-shadow duration-200',
        'cursor-pointer select-none',
        isDragOverlay ? 'shadow-2xl rotate-[1.5deg] scale-[1.03]' : '',
        isDragging ? 'ring-2 ring-primary/30' : '',
      ].join(' ')}
      onClick={isDragging ? undefined : onClick}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity p-0.5 rounded cursor-grab active:cursor-grabbing text-muted-foreground"
        onClick={(e) => e.stopPropagation()}
        aria-label="Drag issue"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <div className="pl-6 pr-3 py-3">
        {/* Top row: label + priority */}
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

        {/* Title */}
        <p className="text-sm font-medium leading-snug text-foreground line-clamp-3 mb-2">
          {issue.title}
        </p>

        {/* Bottom row: assignees */}
        {issue.assignees && issue.assignees.length > 0 && (
          <div className="flex items-center gap-1 mt-2">
            <div className="flex -space-x-1.5">
              {issue.assignees.slice(0, 3).map(a => (
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
              ))}
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
    </motion.div>
  )
}