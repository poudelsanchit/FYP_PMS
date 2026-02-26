import { useState, useCallback } from 'react'

export interface ProjectReportData {
    projectName: string
    generatedAt: string
    summary: {
        totalIssues: number
        totalBoards: number
        totalLabels: number
        totalPriorities: number
        completedIssues: number
        openIssues: number
        completionRate: number
    }
    labelVolume: Array<{
        id: string
        name: string
        color: string
        total: number
        open: number
        inProgress: number
        completed: number
    }>
    priorityVolume: Array<{
        id: string
        name: string
        color: string
        total: number
        open: number
        inProgress: number
        completed: number
    }>
    assigneeWorkload: Array<{
        id: string
        name: string | null
        avatar: string | null
        email: string | null
        totalIssues: number
        openIssues: number
        completedIssues: number
        inProgressIssues: number
    }>
    assigneeCompletionRate: Array<{
        id: string
        name: string | null
        avatar: string | null
        totalIssues: number
        completedIssues: number
        completionRate: number
    }>
    dueDateHealth: {
        total: number
        withDueDate: number
        withoutDueDate: number
        overdue: number
        onTrack: number
        completed: number
        percentWithDueDate: number
        percentOverdue: number
        percentOnTrack: number
    }
}

export function useProjectReports(orgId: string, projectId: string) {
    const [data, setData] = useState<ProjectReportData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchReports = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(
                `/api/organizations/${orgId}/projects/${projectId}/reports`
            )
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Failed to fetch reports')
            setData(json.data)
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }, [orgId, projectId])

    return { data, loading, error, fetchReports }
}
