'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Tag, AlertCircle, User2, ChevronDown } from 'lucide-react'
import type { Issue, Label, Priority, User } from '../types/types'

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

    useEffect(() => {
        if (issue) {
            setTitle(issue.title)
            setDescription(issue.description ?? '')
            setConfirmDelete(false)
        }
    }, [issue])

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

    const handleLabelChange = async (labelId: string | null) => {
        await onUpdate(issue.id, { labelId })
    }

    const handlePriorityChange = async (priorityId: string | null) => {
        await onUpdate(issue.id, { priorityId })
    }

    const handleDelete = async () => {
        if (!confirmDelete) { setConfirmDelete(true); return }
        await onDelete(issue.id)
        onClose()
    }

    const assignedUserIds = new Set(issue.assignees?.map(a => a.userId) ?? [])

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: 40, scale: 0.98 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 40, scale: 0.98 }}
                        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-background border-l border-border shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Issue</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDelete}
                                    className={[
                                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                                        confirmDelete
                                            ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                                            : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                                    ].join(' ')}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {confirmDelete ? 'Confirm delete' : 'Delete'}
                                </button>
                                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <div className="p-5 space-y-5">
                                {/* Title */}
                                <div>
                                    <textarea
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        onBlur={handleSave}
                                        className="w-full text-xl font-semibold text-foreground bg-transparent resize-none outline-none border-0 p-0 leading-snug placeholder:text-muted-foreground/40 focus:ring-0"
                                        placeholder="Issue title"
                                        rows={2}
                                    />
                                </div>

                                {/* Meta row */}
                                <div className="flex flex-wrap gap-2">
                                    {/* Label selector */}
                                    <Selector
                                        icon={<Tag className="h-3 w-3" />}
                                        label={issue.label?.name ?? 'Label'}
                                        color={issue.label?.color}
                                        options={[
                                            { id: '', name: 'No label', color: undefined },
                                            ...labels.map(l => ({ id: l.id, name: l.name, color: l.color })),
                                        ]}
                                        value={issue.labelId ?? ''}
                                        onChange={(v) => handleLabelChange(v || null)}
                                    />

                                    {/* Priority selector */}
                                    <Selector
                                        icon={<AlertCircle className="h-3 w-3" />}
                                        label={issue.priority?.name ?? 'Priority'}
                                        color={issue.priority?.color}
                                        options={[
                                            { id: '', name: 'No priority', color: undefined },
                                            ...priorities.map(p => ({ id: p.id, name: p.name, color: p.color })),
                                        ]}
                                        value={issue.priorityId ?? ''}
                                        onChange={(v) => handlePriorityChange(v || null)}
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        onBlur={handleSave}
                                        className="w-full min-h-[140px] text-sm text-foreground bg-muted/40 border border-border/60 rounded-xl resize-none p-3 outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 transition-all placeholder:text-muted-foreground/40"
                                        placeholder="Add a description…"
                                    />
                                </div>

                                {/* Assignees */}
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Assignees</label>
                                    <div className="space-y-1.5">
                                        {members.map(member => {
                                            const assigned = assignedUserIds.has(member.id)
                                            return (
                                                <button
                                                    key={member.id}
                                                    onClick={() => assigned
                                                        ? onRemoveAssignee(issue.id, member.id)
                                                        : onAddAssignee(issue.id, member.id)
                                                    }
                                                    className={[
                                                        'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all',
                                                        assigned
                                                            ? 'bg-primary/10 border border-primary/20 text-foreground'
                                                            : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground border border-transparent',
                                                    ].join(' ')}
                                                >
                                                    {member.avatar ? (
                                                        <img src={member.avatar} alt={member.name} className="w-6 h-6 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                                            <span className="text-[10px] font-semibold uppercase">{member.name?.[0] ?? '?'}</span>
                                                        </div>
                                                    )}
                                                    <span className="font-medium text-xs flex-1 text-left">{member.name}</span>
                                                    {assigned && (
                                                        <span className="text-[10px] text-primary font-semibold">Assigned</span>
                                                    )}
                                                </button>
                                            )
                                        })}
                                        {members.length === 0 && (
                                            <p className="text-xs text-muted-foreground/50 italic px-1">No project members</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Save button */}
                        <div className="px-5 py-3 border-t border-border shrink-0">
                            <button
                                onClick={handleSave}
                                disabled={saving || !title.trim()}
                                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {saving ? 'Saving…' : 'Save changes'}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

// ── Reusable dropdown selector ──────────────────────────────────────────────
interface SelectorOption { id: string; name: string; color?: string }
interface SelectorProps {
    icon: React.ReactNode
    label: string
    color?: string
    options: SelectorOption[]
    value: string
    onChange: (id: string) => void
}

function Selector({ icon, label, color, options, value, onChange }: SelectorProps) {
    const [open, setOpen] = useState(false)

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                className={[
                    'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
                    'border transition-all hover:bg-muted/60',
                    color ? 'border-transparent' : 'border-border/60 text-muted-foreground',
                ].join(' ')}
                style={color ? {
                    backgroundColor: color + '18',
                    color,
                    borderColor: color + '33',
                } : undefined}
            >
                {color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />}
                {!color && icon}
                {label}
                <ChevronDown className="h-2.5 w-2.5 opacity-60" />
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.97 }}
                            transition={{ duration: 0.12 }}
                            className="absolute left-0 top-full mt-1 z-20 w-44 bg-popover border border-border rounded-xl shadow-xl overflow-hidden"
                        >
                            {options.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => { onChange(opt.id); setOpen(false) }}
                                    className={[
                                        'flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted/60 transition-colors text-left',
                                        opt.id === value ? 'bg-muted/40 font-medium' : 'text-muted-foreground',
                                    ].join(' ')}
                                >
                                    {opt.color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />}
                                    {opt.name}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}