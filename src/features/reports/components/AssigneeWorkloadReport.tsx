'use client'

import { Users } from 'lucide-react'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/core/components/ui/avatar'
import {
    ChartContainer,
    ChartTooltip,
    type ChartConfig,
} from '@/core/components/ui/chart'
import { BoardReportData } from '../hooks/useBoardReports'
import { StatCard } from './shared/StatCard'

interface AssigneeWorkloadReportProps {
    data: BoardReportData
}

export function AssigneeWorkloadReport({ data }: AssigneeWorkloadReportProps) {
    // Prepare chart data with varied colors
    const chartColors = [
        'var(--color-chart-1)',
        'var(--color-chart-2)',
        'var(--color-chart-3)',
        'var(--color-chart-4)',
        'var(--color-chart-5)',
    ]

    const chartData = data.assigneeWorkload.assignees.map((assignee, index) => ({
        name: assignee.name || 'Unknown',
        totalIssues: assignee.totalIssues,
        completedIssues: assignee.completedIssues,
        inProgressIssues: assignee.inProgressIssues,
        todoIssues: assignee.todoIssues,
        fill: chartColors[index % chartColors.length],
        avatar: assignee.avatar,
        id: assignee.id,
    }))

    const chartConfig = {
        totalIssues: {
            label: 'Total Issues',
        },
    } satisfies ChartConfig

    // Calculate stats
    const totalAssignees = data.assigneeWorkload.assignees.length
    const totalAssignedIssues = data.assigneeWorkload.assignees.reduce(
        (sum, a) => sum + a.totalIssues,
        0
    )
    const avgIssuesPerAssignee = totalAssignees > 0 
        ? Math.round((totalAssignedIssues / totalAssignees) * 10) / 10 
        : 0

    // Find most loaded assignee
    const mostLoaded = data.assigneeWorkload.assignees[0]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Assignee Workload Distribution</h2>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Assignees"
                    value={totalAssignees}
                    subtitle="Active team members"
                />

                <StatCard
                    title="Avg per Assignee"
                    value={`${avgIssuesPerAssignee} issues`}
                />

                <StatCard
                    title="Unassigned Issues"
                    value={data.assigneeWorkload.unassignedCount}
                    variant={data.assigneeWorkload.unassignedCount > 0 ? 'warning' : 'default'}
                />

                {mostLoaded && (
                    <StatCard
                        title="Most Loaded"
                        value={`${mostLoaded.totalIssues} issues`}
                        subtitle={mostLoaded.name || 'Unknown'}
                    />
                )}
            </div>

            {/* No assignees */}
            {totalAssignees === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="text-4xl mb-3">👥</div>
                        <h3 className="text-lg font-semibold mb-1">No Assigned Issues</h3>
                        <p className="text-sm text-muted-foreground">
                            All issues are currently unassigned
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Bar Chart */}
            {totalAssignees > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Workload by Assignee</CardTitle>
                        <CardDescription>
                            Number of issues assigned to each team member
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
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-muted-foreground">Total:</span>
                                                        <span className="font-medium">{data.totalIssues}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-muted-foreground">Completed:</span>
                                                        <span className="font-medium text-green-600 dark:text-green-400">
                                                            {data.completedIssues}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-muted-foreground">In Progress:</span>
                                                        <span className="font-medium">{data.inProgressIssues}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-muted-foreground">To Do:</span>
                                                        <span className="font-medium">{data.todoIssues}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }}
                                />
                                <Bar dataKey="totalIssues" radius={[8, 8, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>

                        {/* Legend */}
                        <div className="mt-6 space-y-2">
                            {chartData.map((item, index) => (
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
                                        <span>{item.totalIssues} total</span>
                                        <span className="text-green-600 dark:text-green-400">
                                            {item.completedIssues} done
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {data.assigneeWorkload.unassignedCount > 0 && (
                                <div className="flex items-center justify-between text-sm pt-2 border-t">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-muted" />
                                        <span className="text-muted-foreground">Unassigned</span>
                                    </div>
                                    <span className="text-muted-foreground">
                                        {data.assigneeWorkload.unassignedCount} issues
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
