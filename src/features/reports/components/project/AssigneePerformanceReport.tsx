'use client'

import { useState } from 'react'
import { Users, TrendingUp, Info } from 'lucide-react'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/core/components/ui/avatar'
import { Button } from '@/core/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/core/components/ui/tooltip'
import {
    ChartContainer,
    ChartTooltip,
    type ChartConfig,
} from '@/core/components/ui/chart'
import { ProjectReportData } from '../../hooks/useProjectReports'
import { StatCard } from '../shared/StatCard'

interface AssigneePerformanceReportProps {
    data: ProjectReportData
}

type ViewMode = 'workload' | 'completion'

export function AssigneePerformanceReport({ data }: AssigneePerformanceReportProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('workload')

    const chartColors = [
        'var(--color-chart-1)',
        'var(--color-chart-2)',
        'var(--color-chart-3)',
        'var(--color-chart-4)',
        'var(--color-chart-5)',
    ]

    const workloadData = data.assigneeWorkload.map((assignee, index) => ({
        name: assignee.name || 'Unknown',
        value: assignee.openIssues,
        total: assignee.totalIssues,
        completed: assignee.completedIssues,
        inProgress: assignee.inProgressIssues,
        fill: chartColors[index % chartColors.length],
        avatar: assignee.avatar,
        id: assignee.id,
    }))

    const completionData = data.assigneeCompletionRate.map((assignee, index) => ({
        name: assignee.name || 'Unknown',
        value: assignee.completionRate,
        total: assignee.totalIssues,
        completed: assignee.completedIssues,
        fill: chartColors[index % chartColors.length],
        avatar: assignee.avatar,
        id: assignee.id,
    }))

    const chartData = viewMode === 'workload' ? workloadData : completionData

    const chartConfig = {
        value: {
            label: viewMode === 'workload' ? 'Open Issues' : 'Completion Rate',
        },
    } satisfies ChartConfig

    const avgWorkload = data.assigneeWorkload.length > 0
        ? Math.round(data.assigneeWorkload.reduce((sum, a) => sum + a.openIssues, 0) / data.assigneeWorkload.length * 10) / 10
        : 0

    const avgCompletionRate = data.assigneeCompletionRate.length > 0
        ? Math.round(data.assigneeCompletionRate.reduce((sum, a) => sum + a.completionRate, 0) / data.assigneeCompletionRate.length)
        : 0

    const mostLoaded = data.assigneeWorkload[0]
    const topPerformer = data.assigneeCompletionRate[0]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Team Performance</h2>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                <p>Workload shows who has the most open issues right now. Completion Rate shows who finishes the most work. Use this to balance work fairly across your team.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={viewMode === 'workload' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('workload')}
                    >
                        Workload
                    </Button>
                    <Button
                        variant={viewMode === 'completion' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('completion')}
                    >
                        Completion Rate
                    </Button>
                </div>
            </div>

            {viewMode === 'workload' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        title="Team Members"
                        value={data.assigneeWorkload.length}
                        subtitle="Active assignees"
                    />

                    <StatCard
                        title="Avg Open Issues"
                        value={`${avgWorkload} issues`}
                        subtitle="Per team member"
                    />

                    {mostLoaded && (
                        <StatCard
                            title="Most Loaded"
                            value={`${mostLoaded.openIssues} open`}
                            subtitle={mostLoaded.name || 'Unknown'}
                        />
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        title="Team Members"
                        value={data.assigneeCompletionRate.length}
                        subtitle="Active assignees"
                    />

                    <StatCard
                        title="Avg Completion Rate"
                        value={`${avgCompletionRate}%`}
                        subtitle="Across team"
                    />

                    {topPerformer && (
                        <StatCard
                            title="Top Performer"
                            value={`${topPerformer.completionRate}%`}
                            subtitle={topPerformer.name || 'Unknown'}
                            icon={TrendingUp}
                            variant="success"
                        />
                    )}
                </div>
            )}

            {chartData.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="text-4xl mb-3">👥</div>
                        <h3 className="text-lg font-semibold mb-1">No Assignees</h3>
                        <p className="text-sm text-muted-foreground">
                            Assign issues to team members to see performance metrics
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {viewMode === 'workload' ? 'Open Issues by Assignee' : 'Completion Rate by Assignee'}
                        </CardTitle>
                        <CardDescription>
                            {viewMode === 'workload' 
                                ? 'Number of open issues currently assigned to each team member'
                                : 'Percentage of completed issues for each team member'
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[400px] w-full">
                            <BarChart
                                data={chartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12 }}
                                    label={viewMode === 'completion' ? { value: '%', position: 'insideLeft' } : undefined}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null
                                        const data = payload[0].payload
                                        return (
                                            <div className="rounded-lg border bg-background p-3 shadow-md">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={data.avatar || undefined} />
                                                        <AvatarFallback className="text-xs">
                                                            {data.name?.[0] || '?'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-semibold">{data.name}</span>
                                                </div>
                                                <div className="space-y-1 text-sm">
                                                    {viewMode === 'workload' ? (
                                                        <>
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-muted-foreground">Open:</span>
                                                                <span className="font-medium">{data.value}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-muted-foreground">In Progress:</span>
                                                                <span className="font-medium">{data.inProgress}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-muted-foreground">Completed:</span>
                                                                <span className="font-medium text-green-600 dark:text-green-400">
                                                                    {data.completed}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-muted-foreground">Total:</span>
                                                                <span className="font-medium">{data.total}</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-muted-foreground">Completion Rate:</span>
                                                                <span className="font-medium">{data.value}%</span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-muted-foreground">Completed:</span>
                                                                <span className="font-medium text-green-600 dark:text-green-400">
                                                                    {data.completed}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-muted-foreground">Total:</span>
                                                                <span className="font-medium">{data.total}</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    }}
                                />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>

                        <div className="mt-6 space-y-2">
                            {chartData.map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded"
                                            style={{ backgroundColor: item.fill }}
                                        />
                                        <Avatar className="h-5 w-5">
                                            <AvatarImage src={item.avatar || undefined} />
                                            <AvatarFallback className="text-xs">
                                                {item.name?.[0] || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-muted-foreground">
                                        {viewMode === 'workload' ? (
                                            <>
                                                <span>{item.value} open</span>
                                                <span className="text-green-600 dark:text-green-400">
                                                    {item.completed} done
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <span>{item.value}% rate</span>
                                                <span className="text-green-600 dark:text-green-400">
                                                    {item.completed}/{item.total}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
