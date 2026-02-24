'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Tag, AlertTriangle, CalendarDays, ChevronDown, Check, Loader2 } from 'lucide-react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/core/components/ui/popover'
import { cn } from '@/core/utils/utils'
import type { Issue, Label, Priority, User } from '../types/types'
import { AssigneeMultiSelect } from '@/features/issue/components/AssigneeMultiSelect'

// ─── Types ────────────────────────────────────────────────────────────────────

interface IssueDetailProps {
    issue: Issue | null
    labels: Label[]
    priorities: Priority[]
    members: User[]
    open: boolean
    onClose: () => void
    onUpdate: (issueId: string, payload: {
        title?: string
        description?: string
        labelId?: string | null
        priorityId?: string | null
    }) => Promise<void>
    onDelete: (issueId: string) => Promise<void>
    onAddAssignee: (issueId: string, userId: string) => Promise<void>
    onRemoveAssignee: (issueId: string, userId: string) => Promise<void>
}

// ─── Pill Select (shadcn Popover) ─────────────────────────────────────────────

interface PillOption { id: string; name: string; color?: string }

function PillSelect({
    value,
    options,
    placeholder,
    icon,
    onChange,
}: {
    value: string
    options: PillOption[]
    placeholder: string
    icon: React.ReactNode
    onChange: (id: string) => void
}) {
    const selected = options.find(o => o.id === value)

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border transition-all"
                >
                    {selected?.color ? (
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: selected.color }} />
                    ) : (
                        <span className="shrink-0 opacity-60">{icon}</span>
                    )}
                    <span>{selected?.name ?? placeholder}</span>
                    <ChevronDown className="h-3 w-3 opacity-40" />
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" sideOffset={6} className="w-44 p-1 rounded-lg shadow-lg">
                {options.map(opt => (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChange(opt.id)}
                        className={cn(
                            'w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs text-left transition-colors hover:bg-muted',
                            value === opt.id ? 'text-foreground font-medium' : 'text-muted-foreground'
                        )}
                    >
                        <span className="flex items-center gap-2">
                            {opt.color && <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />}
                            {opt.name}
                        </span>
                        {value === opt.id && <Check className="h-3 w-3 shrink-0" />}
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    )
}

// ─── Assignee Row ─────────────────────────────────────────────────────────────

function AssigneeRow({
    member,
    assigned,
    onToggle,
}: {
    member: User
    assigned: boolean
    onToggle: () => void
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={cn(
                'flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-xs transition-all',
                assigned
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
        >
            {member.avatar ? (
                <img src={member.avatar} alt={member.name ?? ''} className="w-5 h-5 rounded-full object-cover shrink-0" />
            ) : (
                <div className="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                    <span className="text-[8px] font-semibold uppercase">{member.name?.[0] ?? '?'}</span>
                </div>
            )}
            <span className="flex-1 text-left font-medium">{member.name}</span>
            {assigned && (
                <Check className="h-3 w-3 shrink-0 text-muted-foreground" />
            )}
        </button>
    )
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest mb-2">
            {children}
        </p>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function IssueDetail({
    issue,
    labels,
    priorities,
    members,
    open,
    onClose,
    onUpdate,
    onDelete,
    onAddAssignee,
    onRemoveAssignee,
}: IssueDetailProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [saving, setSaving] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const titleRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (issue) {
            setTitle(issue.title)
            setDescription(issue.description ?? '')
            setConfirmDelete(false)
        }
    }, [issue])

    // Auto-grow title textarea
    useEffect(() => {
        if (titleRef.current) {
            titleRef.current.style.height = 'auto'
            titleRef.current.style.height = `${titleRef.current.scrollHeight}px`
        }
    }, [title])

    if (!issue) return null

    const handleSave = async () => {
        if (!title.trim()) return
        setSaving(true)
        try {
            await onUpdate(issue.id, { title: title.trim(), description })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirmDelete) { setConfirmDelete(true); return }
        await onDelete(issue.id)
        onClose()
    }

    const assignedUserIds = new Set(issue.assignees?.map(a => a.userId) ?? [])

    const labelOptions: PillOption[] = [
        { id: '', name: 'No label' },
        ...labels.map(l => ({ id: l.id, name: l.name, color: l.color })),
    ]
    const priorityOptions: PillOption[] = [
        { id: '', name: 'No priority' },
        ...priorities.map(p => ({ id: p.id, name: p.name, color: p.color })),
    ]

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* ── Backdrop ── */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
                        onClick={onClose}
                    />

                    {/* ── Side panel ── */}
                    <motion.div
                        initial={{ opacity: 0, x: 32 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 32 }}
                        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col w-full max-w-[480px] bg-card border-l border-border/80 shadow-2xl overflow-hidden"
                    >

                        {/* ── Top bar (mirrors CreateIssueModal header) ── */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
                            <span className="text-[11px] font-mono text-muted-foreground/50 uppercase tracking-widest select-none">
                                Edit issue
                            </span>
                            <div className="flex items-center gap-1">
                                {/* Delete */}
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all',
                                        confirmDelete
                                            ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                                            : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                                    )}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {confirmDelete ? 'Confirm?' : 'Delete'}
                                </button>
                                {/* Close */}
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* ── Scrollable body ── */}
                        <div className="flex-1 overflow-y-auto">

                            {/* Title + description block (mirrors modal body) */}
                            <div className="flex flex-col px-5 pt-4 pb-2 gap-3">
                                <textarea
                                    ref={titleRef}
                                    value={title}
                                    onChange={e => {
                                        setTitle(e.target.value)
                                        e.currentTarget.style.height = 'auto'
                                        e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`
                                    }}
                                    onBlur={handleSave}
                                    placeholder="Issue title"
                                    rows={1}
                                    className="w-full resize-none overflow-hidden bg-transparent text-[1.05rem] font-semibold text-foreground placeholder:text-muted-foreground/35 focus:outline-none leading-snug"
                                />
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    onBlur={handleSave}
                                    placeholder="Add description… (type '/' for commands, '@' to mention)"
                                    rows={5}
                                    className="w-full resize-none bg-transparent text-sm text-foreground/80 placeholder:text-muted-foreground/30 focus:outline-none leading-relaxed"
                                />
                            </div>

                            {/* ── Meta pills (mirrors modal meta bar) ── */}
                            <div className="flex items-center gap-1.5 px-5 py-3 flex-wrap">
                                <PillSelect
                                    value={issue.priorityId ?? ''}
                                    options={priorityOptions}
                                    placeholder="Priority"
                                    icon={<AlertTriangle className="h-3.5 w-3.5" />}
                                    onChange={v => onUpdate(issue.id, { priorityId: v || null })}
                                />
                                <PillSelect
                                    value={issue.labelId ?? ''}
                                    options={labelOptions}
                                    placeholder="Label"
                                    icon={<Tag className="h-3.5 w-3.5" />}
                                    onChange={v => onUpdate(issue.id, { labelId: v || null })}
                                />
                                <AssigneeMultiSelect
                                    selectedIds={issue.assignees?.map(a => a.userId) ?? []}
                                    members={members}
                                    onSelectionChange={async (newIds) => {
                                        const currentIds = new Set(issue.assignees?.map(a => a.userId) ?? [])
                                        const nextIds = new Set(newIds)
                                        // Add new
                                        for (const id of nextIds) {
                                            if (!currentIds.has(id)) await onAddAssignee(issue.id, id)
                                        }
                                        // Remove removed
                                        for (const id of currentIds) {
                                            if (!nextIds.has(id)) await onRemoveAssignee(issue.id, id)
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border transition-all"
                                >
                                    <CalendarDays className="h-3.5 w-3.5 opacity-60" />
                                    Due date
                                </button>
                            </div>

                        </div>

                        {/* ── Footer (mirrors modal footer) ── */}
                        <div className="h-px bg-border/50 mx-5 shrink-0" />
                        <div className="flex items-center justify-end gap-2 px-5 py-3 shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving || !title.trim()}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Saving…
                                    </>
                                ) : (
                                    'Save changes'
                                )}
                            </button>
                        </div>

                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}