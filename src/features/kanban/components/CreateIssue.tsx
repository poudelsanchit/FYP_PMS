'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { Column, Label, Priority } from '../types/types'

interface CreateIssueModalProps {
    open: boolean
    defaultColumnId: string | null
    columns: Column[]
    labels: Label[]
    priorities: Priority[]
    onClose: () => void
    onCreate: (payload: {
        title: string
        columnId: string
        description?: string
        labelId?: string
        priorityId?: string
        assigneeIds?: string[]
    }) => Promise<unknown>
}

export function CreateIssueModal({
    open,
    defaultColumnId,
    columns,
    labels,
    priorities,
    onClose,
    onCreate,
}: CreateIssueModalProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [columnId, setColumnId] = useState(defaultColumnId ?? columns[0]?.id ?? '')
    const [labelId, setLabelId] = useState('')
    const [priorityId, setPriorityId] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            setTitle('')
            setDescription('')
            setColumnId(defaultColumnId ?? columns[0]?.id ?? '')
            setLabelId('')
            setPriorityId('')
            setError(null)
        }
    }, [open, defaultColumnId, columns])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !columnId) return
        setSubmitting(true)
        setError(null)
        try {
            await onCreate({
                title: title.trim(),
                columnId,
                description: description.trim() || undefined,
                labelId: labelId || undefined,
                priorityId: priorityId || undefined,
            })
            onClose()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create issue')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                            <h2 className="text-sm font-semibold text-foreground">New Issue</h2>
                            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Title */}
                            <div>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Issue title"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full text-base font-medium bg-transparent outline-none border-0 text-foreground placeholder:text-muted-foreground/40 p-0 focus:ring-0"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <textarea
                                placeholder="Description (optional)"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                                className="w-full text-sm bg-muted/40 border border-border/60 rounded-xl resize-none p-3 outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 text-foreground placeholder:text-muted-foreground/40 transition-all"
                            />

                            {/* Selectors row */}
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">Column</label>
                                    <select
                                        value={columnId}
                                        onChange={e => setColumnId(e.target.value)}
                                        className="w-full text-xs bg-muted/40 border border-border/60 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary/30 text-foreground"
                                        required
                                    >
                                        {columns.map(col => (
                                            <option key={col.id} value={col.id}>{col.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">Label</label>
                                    <select
                                        value={labelId}
                                        onChange={e => setLabelId(e.target.value)}
                                        className="w-full text-xs bg-muted/40 border border-border/60 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary/30 text-foreground"
                                    >
                                        <option value="">None</option>
                                        {labels.map(l => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">Priority</label>
                                    <select
                                        value={priorityId}
                                        onChange={e => setPriorityId(e.target.value)}
                                        className="w-full text-xs bg-muted/40 border border-border/60 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary/30 text-foreground"
                                    >
                                        <option value="">None</option>
                                        {priorities.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {error && (
                                <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                                    {error}
                                </p>
                            )}

                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !title.trim()}
                                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {submitting ? 'Creating…' : 'Create issue'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}