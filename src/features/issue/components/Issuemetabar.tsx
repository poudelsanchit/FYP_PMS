'use client'

import { Tag, CalendarDays, AlertTriangle } from 'lucide-react'
import { IssuePillSelect, type PillOption } from './Issuepillselect'
import { AssigneeMultiSelect, type AssigneeMember } from './AssigneeMultiSelect'
import { Popover, PopoverContent, PopoverTrigger } from '@/core/components/ui/popover'
import { cn } from '@/core/utils/utils'

interface IssueMetaBarProps {
    priorityId: string
    labelId: string
    assigneeIds: string[]
    dueDate?: string
    priorityOptions: PillOption[]
    labelOptions: PillOption[]
    members: AssigneeMember[]
    onPriorityChange: (id: string) => void
    onLabelChange: (id: string) => void
    onAssigneesChange: (ids: string[]) => void
    onDueDateChange?: (date: string | null) => void
}

export function IssueMetaBar({
    priorityId,
    labelId,
    assigneeIds,
    dueDate,
    priorityOptions,
    labelOptions,
    members,
    onPriorityChange,
    onLabelChange,
    onAssigneesChange,
    onDueDateChange,
}: IssueMetaBarProps) {
    return (
        <div className="flex items-center gap-1.5 px-5 py-3 flex-wrap">
            <IssuePillSelect
                value={priorityId}
                options={priorityOptions}
                placeholder="Priority"
                icon={<AlertTriangle className="h-3.5 w-3.5" />}
                onChange={onPriorityChange}
            />
            <IssuePillSelect
                value={labelId}
                options={labelOptions}
                placeholder="Label"
                icon={<Tag className="h-3.5 w-3.5" />}
                onChange={onLabelChange}
            />
            <AssigneeMultiSelect
                selectedIds={assigneeIds}
                members={members}
                onSelectionChange={onAssigneesChange}
            />
            {onDueDateChange ? (
                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium border border-border/60 transition-all",
                                dueDate
                                    ? "bg-muted text-foreground hover:bg-muted/80"
                                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border"
                            )}
                        >
                            <CalendarDays className="h-3.5 w-3.5 opacity-60" />
                            {dueDate
                                ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : 'Due date'}
                        </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" sideOffset={6} className="w-auto p-3 rounded-lg shadow-lg">
                        <div className="flex flex-col gap-2">
                            <input
                                type="datetime-local"
                                value={dueDate ? new Date(dueDate).toISOString().slice(0, 16) : ''}
                                onChange={(e) => {
                                    const value = e.target.value ? new Date(e.target.value).toISOString() : null
                                    onDueDateChange(value)
                                }}
                                className="px-2.5 py-1.5 text-xs rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            {dueDate && (
                                <button
                                    type="button"
                                    onClick={() => onDueDateChange(null)}
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Clear due date
                                </button>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            ) : (
                <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border transition-all"
                >
                    <CalendarDays className="h-3.5 w-3.5 opacity-60" />
                    Due date
                </button>
            )}
        </div>
    )
}