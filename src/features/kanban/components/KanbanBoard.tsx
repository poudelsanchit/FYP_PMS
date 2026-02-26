'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { Loader2, AlertCircle, Plus, LayoutGrid, BarChart3 } from 'lucide-react'
import { useBoard, useIssues, useColumns } from '../hooks/hooks'
import { KanbanColumn } from './KanbanColumn'
import { IssueCard } from './IssueCard'
import { AddColumn } from './AddColumn'
import { KanbanFilters, type KanbanFiltersState } from './KanbanFilters'
import { KanbanGroupBy, type GroupByOption } from './KanbanGroupBy'
import type { Issue, Column, Label, Priority } from '../types/types'
import { Button } from '@/core/components/ui/button'
import { CreateIssueModal } from '@/features/issue/components/Createissuemodal'
import { useProjectMembers } from '@/features/projects/hooks/useProjectMembers'
import { useBreadcrumbStore } from '@/store/breadcrumb-store'

interface KanbanBoardProps {
    orgId: string
    projectId: string
    boardId: string
    labels: Label[]
    priorities: Priority[]
    canManage?: boolean
}

export function KanbanBoard({ orgId, projectId, boardId, labels, priorities, canManage = true }: KanbanBoardProps) {
    const router = useRouter()
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
    const { createColumn, deleteColumn, renameColumn, toggleCompleted } = useColumns(orgId, projectId, boardId)
    const { members: projectMembers } = useProjectMembers(orgId, projectId, canManage)
    const { setSegments, clear } = useBreadcrumbStore()

    // Derive members array early for use in useMemo hooks
    const members = useMemo(() => projectMembers.map(pm => pm.user), [projectMembers])

    // Set breadcrumbs when board data is loaded
    useEffect(() => {
        if (!board || !board.project) return
        setSegments([
            { label: board.project.name, href: `/app/${orgId}/${projectId}` },
            { label: board.name },
        ])
        return () => clear()
    }, [board, orgId, projectId, setSegments, clear])

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
    const [dragStartPosition, setDragStartPosition] = useState<{ columnId: string; order: number } | null>(null)

    // UI state
    const [createOpen, setCreateOpen] = useState(false)
    const [createColumnId, setCreateColumnId] = useState<string | null>(null)

    // Filter state
    const [filters, setFilters] = useState<KanbanFiltersState>({
        labelId: null,
        priorityId: null,
        assigneeId: null,
        dueDateFrom: null,
        dueDateTo: null,
    })

    // Group by state
    const [groupBy, setGroupBy] = useState<GroupByOption>('status')

    // DnD sensors — require 8px movement to start drag
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    )

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const issue = issues.find(i => i.id === event.active.id)
        if (issue) {
            setActiveIssue(issue)
            // Store the original position before any optimistic updates
            setDragStartPosition({ columnId: issue.columnId, order: issue.order })
        }
    }, [issues])

    const handleDragOver = useCallback((event: DragOverEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id || !dragStartPosition) return

        const activeIssue = issues.find(i => i.id === active.id)
        if (!activeIssue) return

        // Check if over a column
        const overColumn = columns.find(c => c.id === over.id)
        if (overColumn) {
            if (activeIssue.columnId !== overColumn.id) {
                // Moving to a different column - place at the end
                const targetColumnIssues = issues.filter(i => i.columnId === overColumn.id && i.id !== active.id)
                const newOrder = targetColumnIssues.length
                moveIssueOptimistic(String(active.id), overColumn.id, newOrder)
            }
            return
        }

        // Check if over another issue
        const overIssue = issues.find(i => i.id === over.id)
        if (overIssue && activeIssue.id !== overIssue.id) {
            const targetColumnId = overIssue.columnId

            if (activeIssue.columnId !== targetColumnId) {
                // Moving to a different column - insert at the position of the issue we're hovering over
                const targetColumnIssues = issues.filter(i => i.columnId === targetColumnId && i.id !== active.id)
                const overIssueIndex = targetColumnIssues.findIndex(i => i.id === overIssue.id)
                const newOrder = overIssueIndex >= 0 ? overIssueIndex : targetColumnIssues.length
                moveIssueOptimistic(String(active.id), targetColumnId, newOrder)
            } else if (activeIssue.order !== overIssue.order) {
                // Reordering within the same column
                const sameColumnIssues = issues.filter(i => i.columnId === targetColumnId && i.id !== active.id)
                const overIssueIndex = sameColumnIssues.findIndex(i => i.id === overIssue.id)
                const newOrder = overIssueIndex >= 0 ? overIssueIndex : sameColumnIssues.length
                moveIssueOptimistic(String(active.id), targetColumnId, newOrder)
            }
        }
    }, [issues, columns, dragStartPosition, moveIssueOptimistic])

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveIssue(null)

        if (!over || !dragStartPosition) {
            setDragStartPosition(null)
            return
        }

        const movedIssue = issues.find(i => i.id === active.id)
        if (!movedIssue) {
            setDragStartPosition(null)
            return
        }

        setDragStartPosition(null)

        // Helper function for API base URL
        const BASE = (orgId: string, projectId: string, boardId: string) =>
            `/api/organizations/${orgId}/projects/${projectId}/boards/${boardId}`

        // Handle grouped views differently
        if (groupBy !== 'status') {
            // For grouped views, update the appropriate property when dropped on a different group
            const targetGroupId = String(over.id)

            try {
                const payload: any = {}
                let shouldUpdate = false

                // Store original values for rollback
                const originalLabelId = movedIssue.labelId
                const originalLabel = movedIssue.label
                const originalPriorityId = movedIssue.priorityId
                const originalPriority = movedIssue.priority

                switch (groupBy) {
                    case 'label':
                        if (targetGroupId === 'no-label') {
                            if (movedIssue.labelId) {
                                payload.labelId = null
                                shouldUpdate = true
                                // Optimistic update - clear both labelId and label object
                                setIssues(prev => prev.map(issue =>
                                    issue.id === movedIssue.id ? { ...issue, labelId: null, label: null } : issue
                                ))
                            }
                        } else if (movedIssue.labelId !== targetGroupId) {
                            payload.labelId = targetGroupId
                            shouldUpdate = true
                            // Optimistic update - update labelId and find the label object
                            const newLabel = labels.find(l => l.id === targetGroupId)
                            setIssues(prev => prev.map(issue =>
                                issue.id === movedIssue.id ? { ...issue, labelId: targetGroupId, label: newLabel || null } : issue
                            ))
                        }
                        break
                    case 'priority':
                        if (targetGroupId === 'no-priority') {
                            if (movedIssue.priorityId) {
                                payload.priorityId = null
                                shouldUpdate = true
                                // Optimistic update - clear both priorityId and priority object
                                setIssues(prev => prev.map(issue =>
                                    issue.id === movedIssue.id ? { ...issue, priorityId: null, priority: null } : issue
                                ))
                            }
                        } else if (movedIssue.priorityId !== targetGroupId) {
                            payload.priorityId = targetGroupId
                            shouldUpdate = true
                            // Optimistic update - update priorityId and find the priority object
                            const newPriority = priorities.find(p => p.id === targetGroupId)
                            setIssues(prev => prev.map(issue =>
                                issue.id === movedIssue.id ? { ...issue, priorityId: targetGroupId, priority: newPriority || null } : issue
                            ))
                        }
                        break
                }

                if (shouldUpdate) {
                    try {
                        await updateIssue(movedIssue.id, payload, true)
                    } catch (error) {
                        console.error('Failed to update issue:', error)
                        // Rollback on error - restore both ID and object
                        if (groupBy === 'label') {
                            setIssues(prev => prev.map(issue =>
                                issue.id === movedIssue.id ? { ...issue, labelId: originalLabelId, label: originalLabel } : issue
                            ))
                        } else if (groupBy === 'priority') {
                            setIssues(prev => prev.map(issue =>
                                issue.id === movedIssue.id ? { ...issue, priorityId: originalPriorityId, priority: originalPriority } : issue
                            ))
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to update issue:', error)
            }
            return
        }

        // Status grouping - original logic
        const originalColumnId = dragStartPosition.columnId
        const originalOrder = dragStartPosition.order

        const currentColumnId = movedIssue.columnId
        const currentOrder = movedIssue.order

        const columnChanged = currentColumnId !== originalColumnId
        const orderChanged = currentOrder !== originalOrder

        if (!columnChanged && !orderChanged) return

        try {
            const payload: { columnId?: string; order: number } = {
                order: currentOrder,
            }

            if (columnChanged) {
                payload.columnId = currentColumnId
            }

            await updateIssue(movedIssue.id, payload, true)
        } catch (error) {
            console.error('Failed to update issue position:', error)
            moveIssueOptimistic(String(active.id), originalColumnId, originalOrder)
        }
    }, [issues, dragStartPosition, updateIssue, moveIssueOptimistic, groupBy, setIssues, labels, priorities, orgId, projectId, boardId])

    // Filter issues based on active filters
    const filteredIssues = useMemo(() => {
        return issues.filter(issue => {
            // Label filter
            if (filters.labelId && issue.labelId !== filters.labelId) {
                return false
            }

            // Priority filter
            if (filters.priorityId && issue.priorityId !== filters.priorityId) {
                return false
            }

            // Assignee filter
            if (filters.assigneeId) {
                const hasAssignee = issue.assignees?.some(a => a.userId === filters.assigneeId)
                if (!hasAssignee) return false
            }

            // Due date range filter
            if (filters.dueDateFrom || filters.dueDateTo) {
                if (!issue.dueDate) return false

                const dueDate = new Date(issue.dueDate)

                if (filters.dueDateFrom) {
                    const fromDate = new Date(filters.dueDateFrom)
                    fromDate.setHours(0, 0, 0, 0)
                    if (dueDate < fromDate) return false
                }

                if (filters.dueDateTo) {
                    const toDate = new Date(filters.dueDateTo)
                    toDate.setHours(23, 59, 59, 999)
                    if (dueDate > toDate) return false
                }
            }

            return true
        })
    }, [issues, filters])

    // Group issues based on groupBy option
    const groupedIssues = useMemo(() => {
        interface GroupData {
            id: string
            name: string
            color?: string
            issues: Issue[]
        }

        const groups: GroupData[] = []

        switch (groupBy) {
            case 'status':
                // Group by column/status
                columns.forEach(col => {
                    groups.push({
                        id: col.id,
                        name: col.name,
                        issues: filteredIssues.filter(issue => issue.columnId === col.id),
                    })
                })
                break

            case 'priority':
                // Group by priority - show all priorities
                // Add no priority group first
                const noPriorityIssues = filteredIssues.filter(issue => !issue.priorityId)
                groups.push({
                    id: 'no-priority',
                    name: 'No Priority',
                    issues: noPriorityIssues,
                })

                // Add all priorities (even if they have no issues)
                priorities.forEach(priority => {
                    const priorityIssues = filteredIssues.filter(issue => issue.priorityId === priority.id)
                    groups.push({
                        id: priority.id,
                        name: priority.name,
                        color: priority.color,
                        issues: priorityIssues,
                    })
                })
                break

            case 'label':
                // Group by label - show all labels
                // Add no label group first
                const noLabelIssues = filteredIssues.filter(issue => !issue.labelId)
                groups.push({
                    id: 'no-label',
                    name: 'No Label',
                    issues: noLabelIssues,
                })

                // Add all labels (even if they have no issues)
                labels.forEach(label => {
                    const labelIssues = filteredIssues.filter(issue => issue.labelId === label.id)
                    groups.push({
                        id: label.id,
                        name: label.name,
                        color: label.color,
                        issues: labelIssues,
                    })
                })
                break
        }

        // Sort issues within each group by order
        groups.forEach(group => {
            group.issues.sort((a, b) => a.order - b.order)
        })

        return groups
    }, [filteredIssues, groupBy, columns, priorities, labels])

    // Group issues by column, sorted by order (for status grouping compatibility)
    const issuesByColumn = useMemo(() => {
        const map = new Map<string, Issue[]>()
        columns.forEach(col => map.set(col.id, []))
        filteredIssues.forEach(issue => {
            if (map.has(issue.columnId)) {
                map.get(issue.columnId)!.push(issue)
            }
        })
        map.forEach((arr) => arr.sort((a, b) => a.order - b.order))
        return map
    }, [filteredIssues, columns])

    const handleAddColumn = async (name: string, isCompleted = false) => {
        const col = await createColumn(name, isCompleted)
        setColumns(prev => {
            // If the new column is terminal, unset all other terminal columns
            if (isCompleted) {
                return [...prev.map(c => ({ ...c, isCompleted: false })), col]
            }
            return [...prev, col]
        })
    }

    const handleDeleteColumn = async (columnId: string) => {
        await deleteColumn(columnId)
        setColumns(prev => prev.filter(c => c.id !== columnId))
    }

    const handleRenameColumn = async (columnId: string, name: string) => {
        await renameColumn(columnId, name)
        setColumns(prev => prev.map(c => c.id === columnId ? { ...c, name } : c))
    }

    const handleToggleCompleted = async (columnId: string, isCompleted: boolean) => {
        const updated = await toggleCompleted(columnId, isCompleted)
        setColumns(prev => prev.map(c =>
            c.id === columnId
                ? { ...c, isCompleted }
                : c.isCompleted && isCompleted
                    ? { ...c, isCompleted: false }
                    : c
        ))
    }

    const handleIssueClick = (issue: Issue) => {
        router.push(`/app/${orgId}/${projectId}/${boardId}/${issue.id}`)
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

    return (
        <div className="flex flex-col h-full overflow-hidden min-h-screen">
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
                        <p className="text-xs text-muted-foreground">
                            {filteredIssues.length} {filteredIssues.length === issues.length ? 'issues' : `of ${issues.length} issues`} · {columns.length} columns
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <KanbanGroupBy value={groupBy} onChange={setGroupBy} />

                    <div className="h-4 w-px bg-border" />

                    <KanbanFilters
                        labels={labels}
                        priorities={priorities}
                        members={members}
                        filters={filters}
                        onFiltersChange={setFilters}
                    />

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/app/${orgId}/${projectId}/${boardId}/reports`)}
                        className="h-8 gap-2"
                    >
                        <BarChart3 className="h-3.5 w-3.5" />
                        View Reports
                    </Button>

                    {canManage && (
                        <Button
                            onClick={() => { setCreateColumnId(null); setCreateOpen(true) }}
                            className='rounded-xs cursor-pointer'
                        >
                            <Plus className="h-3.5 w-3.5" />
                            New issue
                        </Button>
                    )}
                </div>
            </motion.div>

            {/* Board canvas */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain">
                <div className="h-full">
                    <DndContext
                        sensors={sensors}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="flex gap-4 p-6 min-w-max h-full">
                            <AnimatePresence>
                                {groupBy === 'status' ? (
                                    // Status grouping - use columns with full management
                                    <>
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
                                                onToggleCompleted={handleToggleCompleted}
                                            />
                                        ))}
                                        {canManage && <AddColumn onAdd={handleAddColumn} />}
                                    </>
                                ) : (
                                    // Other groupings - use grouped issues with drag-and-drop enabled
                                    groupedIssues.map(group => (
                                        <KanbanColumn
                                            key={group.id}
                                            column={{
                                                id: group.id,
                                                name: group.name,
                                                order: 0,
                                                isCompleted: false,
                                                color: group.color,
                                            } as any}
                                            issues={group.issues}
                                            canManage={true}
                                            onIssueClick={handleIssueClick}
                                            onAddIssue={() => { }}
                                            onRename={() => Promise.resolve()}
                                            onDelete={() => Promise.resolve()}
                                            onToggleCompleted={() => Promise.resolve()}
                                            isGroupedView={true}
                                            groupByType={groupBy}
                                        />
                                    ))
                                )}
                            </AnimatePresence>
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
            </div>

            {/* Create issue modal */}
            <CreateIssueModal
                open={createOpen}
                defaultColumnId={createColumnId}
                columns={columns}
                labels={labels}
                priorities={priorities}
                members={members}
                onClose={() => setCreateOpen(false)}
                onCreate={createIssue}
            />
        </div>
    )
}