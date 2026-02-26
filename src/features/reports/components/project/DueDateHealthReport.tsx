'use client'

import { Calendar, AlertTriangle, CheckCircle2, Clock, Info } from 'lucide-react'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell, Pie, PieChart } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card'
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

interface DueDateHealthReportProps {
    data: ProjectReportData
}

export function DueDateHealthReport({ data }: DueDateHealthReportProps) {
    const health = data.dueDateHealth

    const statusData = [
        {
            name: 'On Track',
            value: health.onTrack,
            fill: 'var(--color-chart-2)',
            icon: CheckCircle2,
        },
        {
            name: 'Overdue',
            value: health.overdue,
            fill: 'var(--color-chart-1)',
            icon: AlertTriangle,
        },
        {
            name: 'No Due Date',
            value: health.withoutDueDate,
            fill: 'var(--color-chart-3)',
            icon: Clock,
        },
        {
            name: 'Completed',
            value: health.completed,
            fill: 'var(--color-chart-4)',
            icon: CheckCircle2,
        },
    ]

    const chartConfig = {
        value: {
            label: 'Issues',
        },
    } satisfies ChartConfig

    // Calculate health score (0-100)
    const healthScore = health.withDueDate > 0
        ? Math.round(((health.onTrack + health.completed) / health.total) * 100)
        : 0

    const getHealthVariant = (score: number) => {
        if (score >= 80) return 'success'
        if (score >= 60) return 'default'
        return 'warning'
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Due Date Health</h2>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                            <p>Tracks how healthy your project is based on due dates. Shows what % of work is on track, overdue, or missing a due date. A score above 80% means you're planning and executing well.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Health Score"
                    value={`${healthScore}%`}
                    subtitle="Overall project health"
                    variant={getHealthVariant(healthScore)}
                />

                <StatCard
                    title="With Due Date"
                    value={`${health.percentWithDueDate}%`}
                    subtitle={`${health.withDueDate} of ${health.total} issues`}
                />

                <StatCard
                    title="Overdue"
                    value={health.overdue}
                    subtitle={`${health.percentOverdue}% of dated issues`}
                    variant={health.overdue > 0 ? 'warning' : 'default'}
                    icon={AlertTriangle}
                />

                <StatCard
                    title="On Track"
                    value={health.onTrack}
                    subtitle={`${health.percentOnTrack}% of dated issues`}
                    variant="success"
                    icon={CheckCircle2}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Issue Status Distribution</CardTitle>
                        <CardDescription>
                            Breakdown of issues by due date status
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <BarChart
                                data={statusData}
                                margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
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
                                        const percentage = health.total > 0
                                            ? Math.round((data.value / health.total) * 100)
                                            : 0
                                        return (
                                            <div className="rounded-lg border bg-background p-3 shadow-md">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div
                                                        className="w-3 h-3 rounded"
                                                        style={{ backgroundColor: data.fill }}
                                                    />
                                                    <span className="font-semibold">{data.name}</span>
                                                </div>
                                                <div className="space-y-1 text-sm">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-muted-foreground">Count:</span>
                                                        <span className="font-medium">{data.value}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-muted-foreground">Percentage:</span>
                                                        <span className="font-medium">{percentage}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }}
                                />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                <Card>
                    <CardHeader>
                        <CardTitle>Status Breakdown</CardTitle>
                        <CardDescription>
                            Detailed view of issue statuses
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {statusData.map((item) => {
                                const Icon = item.icon
                                const percentage = health.total > 0
                                    ? Math.round((item.value / health.total) * 100)
                                    : 0
                                return (
                                    <div key={item.name} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded"
                                                    style={{ backgroundColor: item.fill }}
                                                />
                                                <Icon className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-medium">{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">
                                                    {item.value}
                                                </span>
                                                <span className="text-sm font-medium">
                                                    {percentage}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${percentage}%`,
                                                    backgroundColor: item.fill,
                                                }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {health.overdue > 0 && (
                            <div className="mt-6 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                                            {health.overdue} overdue {health.overdue === 1 ? 'issue' : 'issues'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Review and update due dates to improve project health
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {health.withoutDueDate > health.total * 0.3 && (
                            <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <div className="flex items-start gap-2">
                                    <Clock className="h-4 w-4 text-blue-500 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                            {health.withoutDueDate} {health.withoutDueDate === 1 ? 'issue has' : 'issues have'} no due date
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Consider adding due dates for better planning
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
