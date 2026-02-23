'use client'

import { useState, useCallback, useMemo } from 'react'
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragEndEvent,
    type DragOverEvent,
} from '@dnd-kit/core'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertCircle, Plus, LayoutGrid } from 'lucide-react'
import { useBoard, useIssues, useColumns } from '../hooks/hooks'
import { KanbanColumn } from './KanbanColumn'
import { IssueCard } from './IssueCard'
import { IssueDetail } from './Issuedetail'
import { CreateIssueModal } from './CreateIssue'
import { AddColumn } from './AddColumn'
import type { Issue, Column } from '../types/types'

interface KanbanBoardProps {
    orgId: string
    projectId: string
    boardId: string
    canManage?: boolean
}

export function KanbanBoard({ orgId, projectId, boardId, canManage = true }: KanbanBoardProps) {
    const { board, loading: boardLoading, error: boardError } = useBoard(orgId, projectId, boardId)
    const {
        issues,
        loading: issuesLoading,
        error: issuesError,
        createIssue,
        updateIssue,
        deleteIssue,
        moveIssueOptimistic,
        setIssues,
    } = useIssues(orgId, projectId, boardId)
    const { createColumn, deleteColumn, renameColumn } = useColumns(orgId, projectId, boardId)

    // Local column state (synced from board initially)
    const [columns, setColumns] = useState<Column[]>([])
    const [columnsInitialized, setColumnsInitialized] = useState(false)

    // Sync columns from board once
    if (board?.columns && !columnsInitialized) {
        setColumns(board.columns as Column[])
        setColumnsInitialized(true)
    }

    // DnD state
    const [activeIssue, setActiveIssue] = useState<Issue | null>(null)

    // UI state
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [createOpen, setCreateOpen] = useState(false)
    const [createColumnId, setCreateColumnId] = useState<string | null>(null)

    // Assignee management via API
    const handleAddAssignee = useCallback(async (issueId: string, userId: string) => {
        const res = await fetch(
            `/api/organizations/${orgId}/projects/${projectId}/boards/${boardId}/issues/${issueId}/assignees`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            }
        )
        if (!res.ok) throw new Error('Failed to add assignee')
        // Refresh the selected issue
        const issueRes = await fetch(
            `/api/organizations/${orgId}/projects/${projectId}/boards/${boardId}/issues/${issueId}`
        )
        const data = await issueRes.json()
        const updated = data.data as Issue
        setIssues(prev => prev.map(i => i.id === issueId ? updated : i))
        setSelectedIssue(updated)
    }, [orgId, projectId, boardId, setIssues])

    const handleRemoveAssignee = useCallback(async (issueId: string, userId: string) => {
        const res = await fetch(
            `/api/organizations/${orgId}/projects/${projectId}/boards/${boardId}/issues/${issueId}/assignees`,
            {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            }
        )
        if (!res.ok) throw new Error('Failed to remove assignee')
        const issueRes = await fetch(
            `/api/organizations/${orgId}/projects/${projectId}/boards/${boardId}/issues/${issueId}`
        )
        const data = await issueRes.json()
        const updated = data.data as Issue
        setIssues(prev => prev.map(i => i.id === issueId ? updated : i))
        setSelectedIssue(updated)
    }, [orgId, projectId, boardId, setIssues])

    // DnD sensors — require 8px movement to start drag
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    )

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const issue = issues.find(i => i.id === event.active.id)
        setActiveIssue(issue ?? null)
    }, [issues])

    const handleDragOver = useCallback((event: DragOverEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const activeIssue = issues.find(i => i.id === active.id)
        if (!activeIssue) return

        // Over a column
        const overIsColumn = columns.some(c => c.id === over.id)
        if (overIsColumn && activeIssue.columnId !== over.id) {
            moveIssueOptimistic(String(active.id), String(over.id), 9999)
        }

        // Over another issue
        const overIssue = issues.find(i => i.id === over.id)
        if (overIssue && overIssue.columnId !== activeIssue.columnId) {
            moveIssueOptimistic(String(active.id), overIssue.columnId, overIssue.order)
        }
    }, [issues, columns, moveIssueOptimistic])

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveIssue(null)

        if (!over) return

        const movedIssue = issues.find(i => i.id === active.id)
        if (!movedIssue) return

        // Determine target column and order
        let targetColumnId = movedIssue.columnId
        let targetOrder = movedIssue.order

        const overIsColumn = columns.some(c => c.id === over.id)
        if (overIsColumn) {
            targetColumnId = String(over.id)
            const colIssues = issues.filter(i => i.columnId === targetColumnId && i.id !== movedIssue.id)
            targetOrder = colIssues.length
        } else {
            const overIssue = issues.find(i => i.id === over.id)
            if (overIssue) {
                targetColumnId = overIssue.columnId
                targetOrder = overIssue.order
            }
        }

        if (targetColumnId === movedIssue.columnId && targetOrder === movedIssue.order) return

        try {
            await updateIssue(movedIssue.id, {
                columnId: targetColumnId !== movedIssue.columnId ? targetColumnId : undefined,
                order: targetOrder,
            })
        } catch {
            // Revert on failure — refetch
        }
    }, [issues, columns, updateIssue])

    // Group issues by column, sorted by order
    const issuesByColumn = useMemo(() => {
        const map = new Map<string, Issue[]>()
        columns.forEach(col => map.set(col.id, []))
        issues.forEach(issue => {
            if (map.has(issue.columnId)) {
                map.get(issue.columnId)!.push(issue)
            }
        })
        map.forEach((arr) => arr.sort((a, b) => a.order - b.order))
        return map
    }, [issues, columns])

    const handleAddColumn = async (name: string) => {
        const col = await createColumn(name)
        setColumns(prev => [...prev, col])
    }

    const handleDeleteColumn = async (columnId: string) => {
        await deleteColumn(columnId)
        setColumns(prev => prev.filter(c => c.id !== columnId))
    }

    const handleRenameColumn = async (columnId: string, name: string) => {
        await renameColumn(columnId, name)
        setColumns(prev => prev.map(c => c.id === columnId ? { ...c, name } : c))
    }

    const handleIssueClick = (issue: Issue) => {
        setSelectedIssue(issue)
        setDetailOpen(true)
    }

    const handleIssueUpdate = async (issueId: string, payload: Parameters<typeof updateIssue>[1]) => {
        const updated = await updateIssue(issueId, payload)
        setSelectedIssue(updated)
    }

    const handleIssueDelete = async (issueId: string) => {
        await deleteIssue(issueId)
        setDetailOpen(false)
        setSelectedIssue(null)
    }

    // Loading / error states
    if (boardLoading || issuesLoading) {
        return (
            <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading board…</span>
            </div>
        )
    }

    if (boardError || issuesError) {
        return (
            <div className="flex items-center justify-center h-64 gap-3 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{boardError ?? issuesError}</span>
            </div>
        )
    }

    const members = board?.members?.map(m => m.user) ?? []
    const labels = board?.labels ?? []
    const priorities = board?.priorities ?? []

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Board Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0 bg-background/80 backdrop-blur-sm"
            >
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                        <LayoutGrid className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-base font-semibold text-foreground">{board?.name ?? 'Board'}</h1>
                        <p className="text-xs text-muted-foreground">{issues.length} issues · {columns.length} columns</p>
                    </div>
                </div>

                {canManage && (
                    <button
                        onClick={() => { setCreateColumnId(null); setCreateOpen(true) }}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all shadow-sm"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        New issue
                    </button>
                )}
            </motion.div>

            {/* Board canvas */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex gap-4 p-6 h-full min-h-0">
                        <AnimatePresence>
                            {columns.map(column => (
                                <KanbanColumn
                                    key={column.id}
                                    column={column}
                                    issues={issuesByColumn.get(column.id) ?? []}
                                    canManage={canManage}
                                    onIssueClick={handleIssueClick}
                                    onAddIssue={(colId) => { setCreateColumnId(colId); setCreateOpen(true) }}
                                    onRename={handleRenameColumn}
                                    onDelete={handleDeleteColumn}
                                />
                            ))}
                        </AnimatePresence>

                        {canManage && <AddColumn onAdd={handleAddColumn} />}
                    </div>

                    {/* Drag overlay — floating card while dragging */}
                    <DragOverlay>
                        {activeIssue && (
                            <IssueCard
                                issue={activeIssue}
                                onClick={() => { }}
                                isDragOverlay
                            />
                        )}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Issue detail panel */}
            <IssueDetail
                issue={selectedIssue}
                open={detailOpen}
                labels={labels}
                priorities={priorities}
                members={members}
                onClose={() => { setDetailOpen(false); setSelectedIssue(null) }}
                onUpdate={handleIssueUpdate}
                onDelete={handleIssueDelete}
                onAddAssignee={handleAddAssignee}
                onRemoveAssignee={handleRemoveAssignee}
            />

            {/* Create issue modal */}
            <CreateIssueModal
                open={createOpen}
                defaultColumnId={createColumnId}
                columns={columns}
                labels={labels}
                priorities={priorities}
                onClose={() => setCreateOpen(false)}
                onCreate={createIssue}
            />
        </div>
    )
}