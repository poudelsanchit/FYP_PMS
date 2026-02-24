'use client'

import { Tag, CalendarDays, AlertTriangle } from 'lucide-react'
import { IssuePillSelect, type PillOption } from './Issuepillselect'
import { AssigneeMultiSelect, type AssigneeMember } from './AssigneeMultiSelect'

interface IssueMetaBarProps {
    priorityId: string
    labelId: string
    assigneeIds: string[]
    priorityOptions: PillOption[]
    labelOptions: PillOption[]
    members: AssigneeMember[]
    onPriorityChange: (id: string) => void
    onLabelChange: (id: string) => void
    onAssigneesChange: (ids: string[]) => void
}

export function IssueMetaBar({
    priorityId,
    labelId,
    assigneeIds,
    priorityOptions,
    labelOptions,
    members,
    onPriorityChange,
    onLabelChange,
    onAssigneesChange,
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