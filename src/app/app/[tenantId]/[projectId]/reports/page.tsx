'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Tag, AlertCircle, Users, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { useBreadcrumbStore } from '@/store/breadcrumb-store'
import { Button } from '@/core/components/ui/button'
import { useProjectReports } from '@/features/reports/hooks/useProjectReports'
import { LabelVolumeReport } from '@/features/reports/components/project/LabelVolumeReport'
import { PriorityVolumeReport } from '@/features/reports/components/project/PriorityVolumeReport'
import { AssigneePerformanceReport } from '@/features/reports/components/project/AssigneePerformanceReport'
import { DueDateHealthReport } from '@/features/reports/components/project/DueDateHealthReport'

interface ProjectReportsPageProps {
    params: Promise<{
        tenantId: string
        projectId: string
    }>
}

type ReportType = 'labels' | 'priorities' | 'team' | 'due-dates'

const reportTypes = [
    { id: 'labels' as const, label: 'Labels', icon: Tag },
    { id: 'priorities' as const, label: 'Priorities', icon: AlertCircle },
    { id: 'team' as const, label: 'Team Performance', icon: Users },
    { id: 'due-dates' as const, label: 'Due Date Health', icon: Calendar },
]

export default function ProjectReportsPage({ params }: ProjectReportsPageProps) {
    const { tenantId, projectId } = use(params)
    const router = useRouter()
    const [selectedReport, setSelectedReport] = useState<ReportType>('labels')
    const [project, setProject] = useState<any>(null)
    const { setSegments, clear } = useBreadcrumbStore()

    const { data: reportsData, loading: reportsLoading, error: reportsError, fetchReports } = useProjectReports(
        tenantId,
        projectId
    )

    // Fetch project data for breadcrumbs
    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await fetch(`/api/organizations/${tenantId}/projects/${projectId}`)
                const json = await res.json()
                if (!res.ok) throw new Error(json.error || 'Failed to fetch project')
                setProject(json.data)
            } catch (error: any) {
                toast.error('Error loading project', {
                    description: error.message
                })
                router.replace(`/app/${tenantId}`)
            }
        }

        fetchProject()
    }, [tenantId, projectId, router])

    // Fetch reports when component mounts
    useEffect(() => {
        fetchReports()
    }, [fetchReports])

    // Set breadcrumbs
    useEffect(() => {
        if (!project) return
        setSegments([
            { label: project.name, href: `/app/${tenantId}/${projectId}` },
            { label: 'Reports' },
        ])
        return () => clear()
    }, [project, tenantId, projectId, setSegments, clear])

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                <div>
                    <h1 className="text-lg font-semibold text-foreground">
                        Project Reports · {reportsData?.projectName || project?.name || 'Project'}
                    </h1>
                    <p className="text-sm text-muted-foreground">Analytics and insights across all boards</p>
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
                        {selectedReport === 'labels' && (
                            <LabelVolumeReport data={reportsData} />
                        )}
                        {selectedReport === 'priorities' && (
                            <PriorityVolumeReport data={reportsData} />
                        )}
                        {selectedReport === 'team' && (
                            <AssigneePerformanceReport data={reportsData} />
                        )}
                        {selectedReport === 'due-dates' && (
                            <DueDateHealthReport data={reportsData} />
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
