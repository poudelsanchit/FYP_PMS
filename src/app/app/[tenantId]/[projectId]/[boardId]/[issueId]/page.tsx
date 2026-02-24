'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, ArrowLeft, Trash2, Tag, AlertTriangle } from 'lucide-react'
import { MetadataField, LabelField, PriorityField, AssigneeField, DueDateField } from '@/features/issue/components/MetadataField'
import { useProjectLabels } from '@/features/projects/settings/hooks/useProjectLabel'
import { useProjectPriorities } from '@/features/projects/settings/hooks/Useprojectpriorities'
import { useProjectMembers } from '@/features/projects/hooks/useProjectMembers'
import type { Issue } from '@/features/kanban/types/types'
import { cn } from '@/core/utils/utils'

interface PageProps {
    params: Promise<{ tenantId: string; projectId: string; boardId: string; issueId: string }>
}

export default function IssueDetailPage({ params }: PageProps) {
    const { tenantId, projectId, boardId, issueId } = use(params)
    const router = useRouter()

    const [issue, setIssue] = useState<Issue | null>(null)
    const [columnName, setColumnName] = useState<string>('Loading...')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)

    const { labels, fetch: fetchLabels } = useProjectLabels(tenantId, projectId)
    const { priorities, fetch: fetchPriorities } = useProjectPriorities(tenantId, projectId)
    const { members: projectMembers } = useProjectMembers(tenantId, projectId, true)

    useEffect(() => {
        fetchLabels()
        fetchPriorities()
    }, [fetchLabels, fetchPriorities])

    useEffect(() => {
        fetchIssue()
    }, [issueId])

    const fetchIssue = async () => {
        try {
            setLoading(true)
            const res = await fetch(
                `/api/organizations/${tenantId}/projects/${projectId}/boards/${boardId}/issues/${issueId}`
            )
            if (!res.ok) throw new Error('Failed to fetch issue')
            const data = await res.json()
            setIssue(data.data)
            
            // Fetch column name
            const boardRes = await fetch(
                `/api/organizations/${tenantId}/projects/${projectId}/boards/${boardId}`
            )
            if (boardRes.ok) {
                const boardData = await boardRes.json()
                const column = boardData.data.columns?.find((c: any) => c.id === data.data.columnId)
                if (column) setColumnName(column.name)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load issue')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (payload: {
        title?: string
        description?: string
        labelId?: string | null
        priorityId?: string | null
    }) => {
        if (!issue) return
        setSaving(true)
        try {
            const res = await fetch(
                `/api/organizations/${tenantId}/projects/${projectId}/boards/${boardId}/issues/${issueId}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            )
            if (!res.ok) throw new Error('Failed to update issue')
            const data = await res.json()
            setIssue(data.data)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirmDelete) {
            setConfirmDelete(true)
            return
        }
        try {
            const res = await fetch(
                `/api/organizations/${tenantId}/projects/${projectId}/boards/${boardId}/issues/${issueId}`,
                { method: 'DELETE' }
            )
            if (!res.ok) throw new Error('Failed to delete issue')
            router.push(`/app/${tenantId}/${projectId}/${boardId}`)
        } catch (err) {
            console.error('Delete failed:', err)
        }
    }

    const handleAssigneesChange = async (newIds: string[]) => {
        if (!issue) return
        const currentIds = new Set(issue.assignees?.map(a => a.userId) ?? [])
        const nextIds = new Set(newIds)

        try {
            for (const id of nextIds) {
                if (!currentIds.has(id)) {
                    await fetch(
                        `/api/organizations/${tenantId}/projects/${projectId}/boards/${boardId}/issues/${issueId}/assignees`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: id }),
                        }
                    )
                }
            }
            for (const id of currentIds) {
                if (!nextIds.has(id)) {
                    await fetch(
                        `/api/organizations/${tenantId}/projects/${projectId}/boards/${boardId}/issues/${issueId}/assignees`,
                        {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: id }),
                        }
                    )
                }
            }
            await fetchIssue()
        } catch (err) {
            console.error('Failed to update assignees:', err)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading issue…</span>
            </div>
        )
    }

    if (error || !issue) {
        return (
            <div className="flex items-center justify-center h-screen gap-3 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error ?? 'Issue not found'}</span>
            </div>
        )
    }

    const members = projectMembers.map(pm => pm.user)
    const labelOptions = [
        { id: '', name: 'No label' },
        ...labels.map(l => ({ id: l.id, name: l.name, color: l.color })),
    ]
    const priorityOptions = [
        { id: '', name: 'No priority' },
        ...priorities.map(p => ({ id: p.id, name: p.name, color: p.color })),
    ]

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                <button
                    onClick={() => router.push(`/app/${tenantId}/${projectId}/${boardId}`)}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to board
                </button>
                <button
                    type="button"
                    onClick={handleDelete}
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                        confirmDelete
                            ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                            : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                    )}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                    {confirmDelete ? 'Confirm delete?' : 'Delete'}
                </button>
            </div>

            {/* Two-column layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Main content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl px-8 py-8">
                        {/* Title */}
                        <textarea
                            value={issue.title}
                            onChange={e => setIssue({ ...issue, title: e.target.value })}
                            onBlur={() => handleUpdate({ title: issue.title })}
                            placeholder="Issue title"
                            rows={1}
                            className="w-full resize-none overflow-hidden bg-transparent text-2xl font-semibold text-foreground placeholder:text-muted-foreground/35 focus:outline-none leading-tight mb-6"
                            style={{ height: 'auto' }}
                            onInput={e => {
                                e.currentTarget.style.height = 'auto'
                                e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`
                            }}
                        />

                        {/* Description */}
                        <div className="mb-8">
                            <textarea
                                value={issue.description ?? ''}
                                onChange={e => setIssue({ ...issue, description: e.target.value })}
                                onBlur={() => handleUpdate({ description: issue.description ?? undefined })}
                                placeholder="Add description… (type '/' for commands, '@' to mention)"
                                rows={8}
                                className="w-full resize-none bg-transparent text-sm text-foreground/80 placeholder:text-muted-foreground/30 focus:outline-none leading-relaxed"
                            />
                        </div>

                        {/* Activity section */}
                        <div className="mt-12 pt-8 border-t border-border">
                            <h3 className="text-sm font-semibold text-foreground mb-4">Activity</h3>
                            <p className="text-sm text-muted-foreground">Activity feed coming soon…</p>
                        </div>
                    </div>
                </div>

                {/* Right: Metadata sidebar */}
                <div className="w-80 border-l border-border overflow-y-auto bg-card/30">
                    <div className="p-6 space-y-6">

                        {/* Labels */}
                        <MetadataField label="Labels">
                            <LabelField
                                value={issue.labelId ?? ''}
                                options={labelOptions}
                                icon={<Tag className="h-3.5 w-3.5" />}
                                onChange={v => handleUpdate({ labelId: v || null })}
                            />
                        </MetadataField>

                        {/* Priority */}
                        <MetadataField label="Priority">
                            <PriorityField
                                value={issue.priorityId ?? ''}
                                options={priorityOptions}
                                icon={<AlertTriangle className="h-3.5 w-3.5" />}
                                onChange={v => handleUpdate({ priorityId: v || null })}
                            />
                        </MetadataField>

                        {/* Members/Assignees */}
                        <MetadataField label="Members">
                            <AssigneeField
                                selectedIds={issue.assignees?.map(a => a.userId) ?? []}
                                members={members}
                                onSelectionChange={handleAssigneesChange}
                            />
                        </MetadataField>

                        {/* Due date */}
                        <MetadataField label="Due date">
                            <DueDateField />
                        </MetadataField>
                    </div>
                </div>
            </div>

            {/* Save indicator */}
            {saving && (
                <div className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border shadow-lg">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Saving…</span>
                </div>
            )}
        </div>
    )
}
