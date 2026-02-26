'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBoard } from '@/features/kanban/hooks/hooks'
import { Loader2, BarChart3, Clock, AlertCircle, TrendingUp, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useBreadcrumbStore } from '@/store/breadcrumb-store'
import { useBoardReports } from '@/features/reports/hooks/useBoardReports'
import { ColumnDistributionReport } from '@/features/reports/components/ColumnDistributionReport'
import { OverdueReport } from '@/features/reports/components/OverdueReport'
import { ThroughputReport } from '@/features/reports/components/ThroughputReport'
import { AssigneeWorkloadReport } from '@/features/reports/components/AssigneeWorkloadReport'
import { Button } from '@/core/components/ui/button'

interface ReportsPageProps {
    params: Promise<{
        tenantId: string
        projectId: string
        boardId: string
    }>
}

type ReportType = 'column-distribution' | 'cycle-time' | 'overdue' | 'throughput' | 'assignee-workload'

const reportTypes = [
    { id: 'column-distribution' as const, label: 'Column Distribution', icon: BarChart3 },
    { id: 'overdue' as const, label: 'Overdue', icon: AlertCircle },
    { id: 'throughput' as const, label: 'Throughput', icon: TrendingUp },
    { id: 'assignee-workload' as const, label: 'Assignee Workload', icon: Users },
]

export default function ReportsPage({ params }: ReportsPageProps) {
    const { tenantId, projectId, boardId } = use(params)
    const router = useRouter()
    const [hasRedirected, setHasRedirected] = useState(false)
    const [selectedReport, setSelectedReport] = useState<ReportType>('column-distribution')
    const { setSegments, clear } = useBreadcrumbStore()

    // Check board access
    const { board, loading: boardLoading, error: boardError } = useBoard(tenantId, projectId, boardId)

    // Fetch reports data
    const { data: reportsData, loading: reportsLoading, error: reportsError, fetchReports } = useBoardReports(
        tenantId,
        projectId,
        boardId
    )

    // Fetch reports when component mounts
    useEffect(() => {
        if (board) {
            fetchReports()
        }
    }, [board, fetchReports])

    // Set breadcrumbs when board data is loaded
    useEffect(() => {
        if (!board || !board.project) return
        setSegments([
            { label: board.project.name, href: `/app/${tenantId}/${projectId}` },
            { label: board.name, href: `/app/${tenantId}/${projectId}/${boardId}` },
            { label: 'Reports' },
        ])
        return () => clear()
    }, [board, tenantId, projectId, boardId, setSegments, clear])

    // Redirect if user doesn't have access to the board
    useEffect(() => {
        if (!hasRedirected && boardError && (
            boardError.includes('Forbidden') ||
            boardError.includes('not a project member') ||
            boardError.includes('Board not found')
        )) {
            setHasRedirected(true)
            toast.error('Access denied', {
                description: 'You do not have permission to access this board.'
            })
            router.replace(`/app/${tenantId}`)
        }
    }, [boardError, router, tenantId, hasRedirected])

    // Show loading state while checking access or redirecting
    if (boardLoading || hasRedirected) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Don't render if there's an access error
    if (boardError && (
        boardError.includes('Forbidden') ||
        boardError.includes('not a project member') ||
        boardError.includes('Board not found')
    )) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                <div>
                    <h1 className="text-lg font-semibold text-foreground">
                        Reports · {board?.name || 'Board'}
                    </h1>
                    <p className="text-sm text-muted-foreground">Analytics and insights for your board</p>
                </div>
            </div>

            {/* Report Type Selector */}
            <div className="px-6 py-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                    {reportTypes.map(type => {
                        const Icon = type.icon
                        return (
                            <Button
                                key={type.id}
                                variant={selectedReport === type.id ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedReport(type.id)}
                                className="gap-2"
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {type.label}
                            </Button>
                        )
                    })}
                </div>
            </div>

            {/* Report Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {reportsLoading && (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                )}

                {reportsError && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-3">
                            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                            <h2 className="text-xl font-semibold text-foreground">Error Loading Reports</h2>
                            <p className="text-sm text-muted-foreground">{reportsError}</p>
                        </div>
                    </div>
                )}

                {!reportsLoading && !reportsError && reportsData && (
                    <>
                        {selectedReport === 'column-distribution' && (
                            <ColumnDistributionReport data={reportsData} />
                        )}
                        {selectedReport === 'overdue' && (
                            <OverdueReport data={reportsData} />
                        )}
                        {selectedReport === 'throughput' && (
                            <ThroughputReport data={reportsData} />
                        )}
                        {selectedReport === 'assignee-workload' && (
                            <AssigneeWorkloadReport data={reportsData} />
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
