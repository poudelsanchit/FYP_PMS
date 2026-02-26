import { useState, useCallback } from 'react'

export interface ReportIssue {
    id: string
    title: string
    priority: { name: string; color: string } | null
    label: { name: string; color: string } | null
    dueDate: string | null
    assignees: Array<{ id: string; name: string | null; avatar: string | null }>
}

export interface ReportColumn {
    id: string
    name: string
    order: number
    isCompleted: boolean
    issueCount: number
    issues: ReportIssue[]
}

export interface BoardReportData {
    boardName: string
    generatedAt: string
    columns: ReportColumn[]
    summary: {
        totalIssues: number
        completedIssues: number
        overdueIssues: number
        completionRate: number
    }
    overdue: {
        total: number
        issues: Array<ReportIssue & { columnName: string; daysOverdue: number }>
    }
    throughput: {
        daily: Array<{ day: string; count: number; dayStart: string }>
        weekly: Array<{ week: string; count: number; weekStart: string }>
        monthly: Array<{ month: string; count: number; monthStart: string }>
        averageDaily: number
        averageWeekly: number
        averageMonthly: number
        velocityTrend: 'improving' | 'declining' | 'stable'
    }
    assigneeWorkload: {
        assignees: Array<{
            id: string
            name: string | null
            avatar: string | null
            email: string | null
            totalIssues: number
            completedIssues: number
            inProgressIssues: number
            todoIssues: number
        }>
        unassignedCount: number
    }
}

export function useBoardReports(orgId: string, projectId: string, boardId: string) {
    const [data, setData] = useState<BoardReportData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchReports = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(
                `/api/organizations/${orgId}/projects/${projectId}/boards/${boardId}/reports`
            )
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Failed to fetch reports')
            setData(json.data)
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }, [orgId, projectId, boardId])

    return { data, loading, error, fetchReports }
}
