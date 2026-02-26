'use client'

import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronRight, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card'
import { Button } from '@/core/components/ui/button'
import { BoardReportData } from '../hooks/useBoardReports'
import { StatCard } from './shared/StatCard'
import { IssueTable, PriorityBadge, LabelBadge, AssigneeAvatars } from './shared/IssueTable'
import { cn } from '@/core/utils/utils'

interface OverdueReportProps {
    data: BoardReportData
}

type GroupBy = 'column' | 'assignee'

export function OverdueReport({ data }: OverdueReportProps) {
    const [groupBy, setGroupBy] = useState<GroupBy>('column')
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev)
            if (next.has(groupId)) {
                next.delete(groupId)
            } else {
                next.add(groupId)
            }
            return next
        })
    }

    const getOverdueSeverity = (days: number) => {
        if (days > 5) return { color: 'text-red-600 dark:text-red-400', icon: '🔴', label: 'Critical' }
        if (days >= 2) return { color: 'text-yellow-600 dark:text-yellow-400', icon: '🟡', label: 'Warning' }
        return { color: 'text-orange-600 dark:text-orange-400', icon: '🟠', label: 'Attention' }
    }

    // Group overdue issues
    const groupedIssues = groupBy === 'column'
        ? data.columns.map(col => ({
            id: col.id,
            name: col.name,
            issues: data.overdue.issues.filter(issue => issue.columnName === col.name),
        })).filter(group => group.issues.length > 0)
        : (() => {
            const groups: Array<{ id: string; name: string; issues: typeof data.overdue.issues }> = []
            
            // Unassigned group
            const unassigned = data.overdue.issues.filter(issue => !issue.assignees || issue.assignees.length === 0)
            if (unassigned.length > 0) {
                groups.push({ id: 'unassigned', name: 'Unassigned', issues: unassigned })
            }

            // Get unique assignees
            const assigneeMap = new Map<string, { name: string; issues: typeof data.overdue.issues }>()
            data.overdue.issues.forEach(issue => {
                issue.assignees?.forEach(assignee => {
                    if (!assigneeMap.has(assignee.id)) {
                        assigneeMap.set(assignee.id, { name: assignee.name || 'Unknown', issues: [] })
                    }
                    assigneeMap.get(assignee.id)!.issues.push(issue)
                })
            })

            assigneeMap.forEach((value, key) => {
                groups.push({ id: key, name: value.name, issues: value.issues })
            })

            return groups
        })()

    const columns = groupBy === 'column'
        ? [
            {
                key: 'title',
                label: 'Issue',
                render: (issue: any) => <span className="font-medium">{issue.title}</span>,
            },
            {
                key: 'dueDate',
                label: 'Due Date',
                render: (issue: any) => issue.dueDate ? new Date(issue.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-',
            },
            {
                key: 'overdue',
                label: 'Overdue by',
                render: (issue: any) => {
                    const severity = getOverdueSeverity(issue.daysOverdue)
                    return (
                        <span className={cn('font-medium', severity.color)}>
                            {issue.daysOverdue} {issue.daysOverdue === 1 ? 'day' : 'days'} {severity.icon}
                        </span>
                    )
                },
            },
            {
                key: 'assignees',
                label: 'Assignees',
                render: (issue: any) => <AssigneeAvatars assignees={issue.assignees || []} />,
            },
        ]
        : [
            {
                key: 'title',
                label: 'Issue',
                render: (issue: any) => <span className="font-medium">{issue.title}</span>,
            },
            {
                key: 'dueDate',
                label: 'Due Date',
                render: (issue: any) => issue.dueDate ? new Date(issue.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-',
            },
            {
                key: 'overdue',
                label: 'Overdue by',
                render: (issue: any) => {
                    const severity = getOverdueSeverity(issue.daysOverdue)
                    return (
                        <span className={cn('font-medium', severity.color)}>
                            {issue.daysOverdue} {issue.daysOverdue === 1 ? 'day' : 'days'} {severity.icon}
                        </span>
                    )
                },
            },
            {
                key: 'column',
                label: 'Column',
                render: (issue: any) => <span className="text-muted-foreground">{issue.columnName}</span>,
            },
        ]

    return (
        <div className="space-y-6">
            {/* Header with Group By Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <h2 className="text-lg font-semibold">Overdue Issues · {data.overdue.total} total</h2>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Group by:</span>
                    <Button
                        variant={groupBy === 'column' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setGroupBy('column')}
                    >
                        Column
                    </Button>
                    <Button
                        variant={groupBy === 'assignee' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setGroupBy('assignee')}
                    >
                        Assignee
                    </Button>
                </div>
            </div>

            {/* Summary Card */}
            <StatCard
                title="Total Overdue"
                value={data.overdue.total}
                subtitle={`${Math.round((data.overdue.total / data.summary.totalIssues) * 100)}% of all issues`}
                icon={Calendar}
                variant="warning"
            />

            {/* No overdue issues */}
            {data.overdue.total === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="text-4xl mb-3">✅</div>
                        <h3 className="text-lg font-semibold mb-1">No Overdue Issues</h3>
                        <p className="text-sm text-muted-foreground">All issues are on track!</p>
                    </CardContent>
                </Card>
            )}

            {/* Grouped Issues */}
            {groupedIssues.map(group => {
                const isExpanded = expandedGroups.has(group.id)
                const isUnassigned = group.id === 'unassigned'

                return (
                    <Card key={group.id} className={cn(isUnassigned && 'border-orange-500/50')}>
                        <CardHeader
                            className="cursor-pointer hover:bg-accent/50 transition-colors"
                            onClick={() => toggleGroup(group.id)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                    <CardTitle className="text-base">
                                        {group.name} ({group.issues.length} overdue)
                                    </CardTitle>
                                    {isUnassigned && (
                                        <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                            ⚠️ Needs attention
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        {isExpanded && (
                            <CardContent>
                                <IssueTable issues={group.issues} columns={columns} />
                            </CardContent>
                        )}
                    </Card>
                )
            })}
        </div>
    )
}
