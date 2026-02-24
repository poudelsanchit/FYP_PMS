'use client'

import { UserCircle2, Tag, CalendarDays, AlertTriangle } from 'lucide-react'
import { IssuePillSelect, type PillOption } from './Issuepillselect'

interface IssueMetaBarProps {
    priorityId: string
    labelId: string
    priorityOptions: PillOption[]
    labelOptions: PillOption[]
    onPriorityChange: (id: string) => void
    onLabelChange: (id: string) => void
}

export function IssueMetaBar({
    priorityId,
    labelId,
    priorityOptions,
    labelOptions,
    onPriorityChange,
    onLabelChange,
}: IssueMetaBarProps) {
    return (
        <div className="flex items-center gap-1.5 px-5 py-3 flex-wrap">
            {/* Priority */}
            <IssuePillSelect
                value={priorityId}
                options={priorityOptions}
                placeholder="Priority"
                icon={<AlertTriangle className="h-3.5 w-3.5" />}
                onChange={onPriorityChange}
            />

            {/* Label */}
            <IssuePillSelect
                value={labelId}
                options={labelOptions}
                placeholder="Label"
                icon={<Tag className="h-3.5 w-3.5" />}
                onChange={onLabelChange}
            />

            {/* Assignee — extend with your own Popover/search */}
            <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border transition-all"
            >
                <UserCircle2 className="h-3.5 w-3.5 opacity-60" />
                Assignee
            </button>

            {/* Due date — extend with your own date picker */}
            <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border transition-all"
            >
                <CalendarDays className="h-3.5 w-3.5 opacity-60" />
                Due date
            </button>
        </div>
    )
}