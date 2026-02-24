'use client'

import { IssuePillSelect, type PillOption } from './Issuepillselect'
import { AssigneeMultiSelect, type AssigneeMember } from './AssigneeMultiSelect'
import { CalendarDays } from 'lucide-react'
import { cn } from '@/core/utils/utils'

// ─── Shared section wrapper ───────────────────────────────────────────────────

export function MetadataField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex   py-3 border-b border-border/40 last:border-0">
            <span className="text-xs text-muted-foreground/60 shrink-0 w-20 pt-1.5 leading-none">
                {label}
            </span>
            <div className="flex-1 flex ">
                {children}
            </div>
        </div>
    )
}

// ─── Label field ──────────────────────────────────────────────────────────────

interface LabelFieldProps {
    value: string
    options: PillOption[]
    icon: React.ReactNode
    onChange: (id: string) => void
}

export function LabelField({ value, options, icon, onChange }: LabelFieldProps) {
    return (
        <IssuePillSelect
            value={value}
            options={options}
            placeholder="No label"
            icon={icon}
            onChange={onChange}
        />
    )
}

// ─── Priority field ───────────────────────────────────────────────────────────

interface PriorityFieldProps {
    value: string
    options: PillOption[]
    icon: React.ReactNode
    onChange: (id: string) => void
}

export function PriorityField({ value, options, icon, onChange }: PriorityFieldProps) {
    return (
        <IssuePillSelect
            value={value}
            options={options}
            placeholder="No priority"
            icon={icon}
            onChange={onChange}
        />
    )
}

// ─── Assignee field ───────────────────────────────────────────────────────────

interface AssigneeFieldProps {
    selectedIds: string[]
    members: AssigneeMember[]
    onSelectionChange: (ids: string[]) => void
}

export function AssigneeField({ selectedIds, members, onSelectionChange }: AssigneeFieldProps) {
    return (
        <AssigneeMultiSelect
            selectedIds={selectedIds}
            members={members}
            onSelectionChange={onSelectionChange}
        />
    )
}

// ─── Due date field ───────────────────────────────────────────────────────────

import { Popover, PopoverContent, PopoverTrigger } from '@/core/components/ui/popover'

interface DueDateFieldProps {
    value?: string | null
    onChange: (date: string | null) => void
}

export function DueDateField({ value, onChange }: DueDateFieldProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium border border-border/60 transition-all",
                        value
                            ? "bg-muted text-foreground hover:bg-muted/80"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border"
                    )}
                >
                    <CalendarDays className="h-3.5 w-3.5 opacity-60" />
                    {value
                        ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'No due date'}
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" sideOffset={6} className="w-auto p-3 rounded-lg shadow-lg">
                <div className="flex flex-col gap-2">
                    <input
                        type="datetime-local"
                        value={value ? new Date(value).toISOString().slice(0, 16) : ''}
                        onChange={(e) => {
                            const newValue = e.target.value ? new Date(e.target.value).toISOString() : null
                            onChange(newValue)
                        }}
                        className="px-2.5 py-1.5 text-xs rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {value && (
                        <button
                            type="button"
                            onClick={() => onChange(null)}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Clear due date
                        </button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}

// ─── Status / column field ────────────────────────────────────────────────────

interface StatusOption {
    id: string
    name: string
    color: string
}

interface StatusFieldProps {
    value: string
    options: StatusOption[]
    onChange: (id: string) => void
}

export function StatusField({ value, options, onChange }: StatusFieldProps) {
    const selected = options.find(o => o.id === value)

    const pillOptions: PillOption[] = options.map(o => ({
        id: o.id,
        name: o.name,
        color: o.color,
    }))

    return (
        <IssuePillSelect
            value={value}
            options={pillOptions}
            placeholder="No status"
            icon={
                selected ? (
                    <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: selected.color }}
                    />
                ) : null
            }
            onChange={onChange}
        />
    )
}

// ─── Composed sidebar panel ───────────────────────────────────────────────────

interface IssueMetadataPanelProps {
    // Status
    columnId: string
    columnOptions: StatusOption[]
    onColumnChange: (id: string) => void
    // Label
    labelId: string
    labelOptions: PillOption[]
    labelIcon: React.ReactNode
    onLabelChange: (id: string) => void
    // Priority
    priorityId: string
    priorityOptions: PillOption[]
    priorityIcon: React.ReactNode
    onPriorityChange: (id: string) => void
    // Assignees
    assigneeIds: string[]
    members: AssigneeMember[]
    onAssigneesChange: (ids: string[]) => void
    // Due date
    dueDate?: string | null
    onDueDateChange: (date: string | null) => void
}

export function IssueMetadataPanel({
    columnId,
    columnOptions,
    onColumnChange,
    labelId,
    labelOptions,
    labelIcon,
    onLabelChange,
    priorityId,
    priorityOptions,
    priorityIcon,
    onPriorityChange,
    assigneeIds,
    members,
    onAssigneesChange,
    dueDate,
    onDueDateChange,
}: IssueMetadataPanelProps) {
    return (
        <div className="rounded-lg border border-border/50 bg-card px-4 divide-y divide-border/40">
            <MetadataField label="Status">
                <StatusField
                    value={columnId}
                    options={columnOptions}
                    onChange={onColumnChange}
                />
            </MetadataField>

            <MetadataField label="Label">
                <LabelField
                    value={labelId}
                    options={labelOptions}
                    icon={labelIcon}
                    onChange={onLabelChange}
                />
            </MetadataField>

            <MetadataField label="Priority">
                <PriorityField
                    value={priorityId}
                    options={priorityOptions}
                    icon={priorityIcon}
                    onChange={onPriorityChange}
                />
            </MetadataField>

            <MetadataField label="Assignees">
                <AssigneeField
                    selectedIds={assigneeIds}
                    members={members}
                    onSelectionChange={onAssigneesChange}
                />
            </MetadataField>

            <MetadataField label="Due date">
                <DueDateField value={dueDate} onChange={onDueDateChange} />
            </MetadataField>
        </div>
    )
}