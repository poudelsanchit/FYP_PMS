'use client'

import { useState, useEffect, useRef } from 'react'

import { IssueStatusPill, type StatusOption } from './Issuestatuspill'
import { IssueTitleInput, type IssueTitleInputHandle } from './Issuetitleinput'
import { IssueDescriptionInput } from './Issuedescriptioninput'
import { IssueMetaBar } from './Issuemetabar'
import { IssueModalFooter } from './Issuemodalfooter'
import { IssueErrorBanner } from './Issueerrorbanner'
import { Column, Label, Priority } from '@/features/kanban/types/types'
import { Separator } from '@/core/components/ui/separator'
import { Dialog, DialogContent } from '@/core/components/ui/dialog'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateIssueModalProps {
    open: boolean
    defaultColumnId: string | null
    columns: Column[]
    labels: Label[]
    priorities: Priority[]
    members: { id: string; name: string | null; email: string; avatar: string | null }[]
    onClose: () => void
    onCreate: (payload: {
        title: string
        columnId: string
        description?: string
        labelId?: string
        priorityId?: string
        dueDate?: string
        assigneeIds?: string[]
    }) => Promise<unknown>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
    backlog: '#6b7280',
    todo: '#3b82f6',
    'in progress': '#f59e0b',
    done: '#22c55e',
    cancelled: '#ef4444',
}

function getColumnColor(name: string): string {
    return STATUS_COLORS[name.toLowerCase()] ?? '#6b7280'
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateIssueModal({
    open,
    defaultColumnId,
    columns,
    labels,
    priorities,
    members,
    onClose,
    onCreate,
}: CreateIssueModalProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [columnId, setColumnId] = useState(defaultColumnId ?? columns[0]?.id ?? '')
    const [labelId, setLabelId] = useState('')
    const [priorityId, setPriorityId] = useState('')
    const [dueDate, setDueDate] = useState<string | null>(null)
    const [assigneeIds, setAssigneeIds] = useState<string[]>([])
    const [createAnother, setCreateAnother] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const titleRef = useRef<IssueTitleInputHandle>(null)

    // ── Reset on open ──
    useEffect(() => {
        if (open) {
            setTitle('')
            setDescription('')
            setColumnId(defaultColumnId ?? columns[0]?.id ?? '')
            setLabelId('')
            setPriorityId('')
            setDueDate(null)
            setAssigneeIds([])
            setError(null)
            setTimeout(() => titleRef.current?.focus(), 60)
        }
    }, [open, defaultColumnId, columns])

    // ── Submit ──
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
                dueDate: dueDate || undefined,
                assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
            })

            if (createAnother) {
                setTitle('')
                setDescription('')
                setLabelId('')
                setPriorityId('')
                setDueDate(null)
                setAssigneeIds([])
                setTimeout(() => titleRef.current?.focus(), 60)
            } else {
                onClose()
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create issue')
        } finally {
            setSubmitting(false)
        }
    }

    // ── Derived options ──
    const statusOptions: StatusOption[] = columns.map(c => ({
        id: c.id,
        name: c.name,
        color: getColumnColor(c.name),
    }))

    const priorityOptions = priorities.map(p => ({
        id: p.id,
        name: p.name,
        color: (p as { color?: string }).color,
    }))

    const labelOptions = labels.map(l => ({
        id: l.id,
        name: l.name,
        color: (l as { color?: string }).color,
    }))

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-[600px] p-0 gap-0 overflow-visible">
                <form onSubmit={handleSubmit} className="flex flex-col">

                    {/* ── Header ── */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                        <IssueStatusPill
                            value={columnId}
                            options={statusOptions}
                            onChange={setColumnId}
                        />
                    </div>

                    {/* ── Body ── */}
                    <div className="flex flex-col px-5 pt-4 pb-2 gap-3">
                        <IssueTitleInput
                            ref={titleRef}
                            value={title}
                            onChange={setTitle}
                            onEnter={() => document.getElementById('issue-desc')?.focus()}
                        />
                        <Separator className='h-0.5 bg-border/50 ' />
                        <IssueDescriptionInput
                            id="issue-desc"
                            value={description}
                            onChange={setDescription}
                        />
                    </div>

                    {/* ── Meta pills ── */}
                    <IssueMetaBar
                        priorityId={priorityId}
                        labelId={labelId}
                        assigneeIds={assigneeIds}
                        dueDate={dueDate ?? undefined}
                        priorityOptions={priorityOptions}
                        labelOptions={labelOptions}
                        members={members}
                        onPriorityChange={setPriorityId}
                        onLabelChange={setLabelId}
                        onAssigneesChange={setAssigneeIds}
                        onDueDateChange={setDueDate}
                    />

                    {/* ── Error ── */}
                    {error && <IssueErrorBanner message={error} />}

                    {/* ── Divider ── */}
                    <div className="h-px bg-border/50 mx-5" />

                    {/* ── Footer ── */}
                    <IssueModalFooter
                        submitting={submitting}
                        canSubmit={!!title.trim()}
                        createAnother={createAnother}
                        onCreateAnotherChange={setCreateAnother}
                        onCancel={onClose}
                    />

                </form>
            </DialogContent>
        </Dialog>
    )
}