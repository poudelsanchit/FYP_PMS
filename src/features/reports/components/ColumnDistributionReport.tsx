'use client'

import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronRight, Info } from 'lucide-react'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell, Rectangle } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card'
import { Alert, AlertDescription } from '@/core/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/core/components/ui/avatar'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/core/components/ui/tooltip'
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/core/components/ui/chart'
import { BoardReportData } from '../hooks/useBoardReports'
import { cn } from '@/core/utils/utils'

interface ColumnDistributionReportProps {
    data: BoardReportData
}

export function ColumnDistributionReport({ data }: ColumnDistributionReportProps) {
    const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set())

    const toggleColumn = (columnId: string) => {
        setExpandedColumns(prev => {
            const next = new Set(prev)
            if (next.has(columnId)) {
                next.delete(columnId)
            } else {
                next.add(columnId)
            }
            return next
        })
    }

    // Prepare chart data with varied colors
    const chartColors = [
        'var(--color-chart-1)',
        'var(--color-chart-2)',
        'var(--color-chart-3)',
        'var(--color-chart-4)',
        'var(--color-chart-5)',
    ]
    
    const chartData = data.columns.map((col, index) => ({
        name: col.name,
        count: col.issueCount,
        fill: col.isCompleted ? 'var(--color-chart-2)' : chartColors[index % chartColors.length],
        percentage: data.summary.totalIssues > 0 
            ? Math.round((col.issueCount / data.summary.totalIssues) * 100) 
            : 0,
        isCompleted: col.isCompleted,
    }))

    // Find the index of the column with most issues (excluding completed columns)
    const nonCompletedData = chartData.filter(item => !item.isCompleted)
    const maxIssueCount = Math.max(...nonCompletedData.map(item => item.count), 0)
    const activeIndex = chartData.findIndex(item => !item.isCompleted && item.count === maxIssueCount && maxIssueCount > 0)

    const chartConfig = {
        count: {
            label: 'Issues',
        },
    } satisfies ChartConfig

    // Find bottleneck (non-completed column with most issues)
    const nonCompletedColumns = data.columns.filter(col => !col.isCompleted)
    const bottleneck = nonCompletedColumns.length > 0
        ? nonCompletedColumns.reduce((max, col) => 
            col.issueCount > max.issueCount ? col : max
          )
        : null

    const hasBottleneck = bottleneck && bottleneck.issueCount > 0 && 
        nonCompletedColumns.length > 1 &&
        bottleneck.issueCount > data.summary.totalIssues * 0.3

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Column Distribution</h2>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                            <p>See how many issues are stuck in each column. Helps you spot where work is piling up and understand how far along your board is overall.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className='rounded-sm'>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Issues
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.summary.totalIssues}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Completed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {data.summary.completedIssues}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Overdue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {data.summary.overdueIssues}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Completion Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.summary.completionRate}%</div>
                    </CardContent>
                </Card>
            </div>

            {/* Bar Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Column Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ left: 100, right: 100 }}
                        >
                            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tickLine={false}
                                axisLine={false}
                                width={90}
                            />
                            <XAxis type="number" hide />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Bar 
                                dataKey="count" 
                                radius={4}
                                activeIndex={activeIndex}
                                activeBar={({ ...props }) => {
                                    return (
                                        <Rectangle
                                            {...props}
                                            fillOpacity={0.8}
                                            stroke={props.payload.fill}
                                            strokeWidth={2}
                                            strokeDasharray={4}
                                            strokeDashoffset={4}
                                        />
                                    )
                                }}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>

                    {/* Legend with percentages */}
                    <div className="mt-4 space-y-2">
                        {chartData.map((item, index) => {
                            const col = data.columns[index]
                            const isBottleneck = hasBottleneck && bottleneck?.id === col.id

                            return (
                                <div key={col.id} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded"
                                            style={{ backgroundColor: item.fill }}
                                        />
                                        <span className={cn(item.isCompleted && 'text-green-600 dark:text-green-400')}>
                                            {item.name}
                                            {item.isCompleted && ' ✓'}
                                        </span>
                                        {isBottleneck && (
                                            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                                        )}
                                    </div>
                                    <span className="text-muted-foreground">
                                        {item.count} ({item.percentage}%)
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Bottleneck Alert */}
            {hasBottleneck && bottleneck && (
                <Alert className="border-orange-500/50 bg-orange-500/10">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <AlertDescription className="text-foreground">
                        <span className="font-semibold text-orange-600 dark:text-orange-400">Bottleneck detected</span>"{bottleneck.name}" has {bottleneck.issueCount} issues (
                        {Math.round((bottleneck.issueCount / data.summary.totalIssues) * 100)}% of all work).
                        <span className="block mt-1 text-muted-foreground text-sm">
                            Consider reviewing WIP or reassigning tasks.
                        </span>
                    </AlertDescription>
                </Alert>
            )}

            {/* Expandable Column Tables */}
            <div className="space-y-2">
                {data.columns.map(col => {
                    const isExpanded = expandedColumns.has(col.id)
                    return (
                        <Card key={col.id}>
                            <CardHeader
                                className="cursor-pointer hover:bg-accent/50 transition-colors"
                                onClick={() => toggleColumn(col.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                        <CardTitle className="text-base">
                                            {col.name} ({col.issueCount} issues)
                                        </CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            {isExpanded && col.issues.length > 0 && (
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b text-sm text-muted-foreground">
                                                    <th className="text-left py-2 px-2">Title</th>
                                                    <th className="text-left py-2 px-2">Priority</th>
                                                    <th className="text-left py-2 px-2">Label</th>
                                                    <th className="text-left py-2 px-2">Assignees</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {col.issues.map(issue => (
                                                    <tr key={issue.id} className="border-b last:border-0">
                                                        <td className="py-3 px-2 text-sm">{issue.title}</td>
                                                        <td className="py-3 px-2">
                                                            {issue.priority && (
                                                                <span
                                                                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                                                                    style={{
                                                                        backgroundColor: `${issue.priority.color}18`,
                                                                        color: issue.priority.color,
                                                                    }}
                                                                >
                                                                    {issue.priority.name}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-2">
                                                            {issue.label && (
                                                                <span
                                                                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                                                                    style={{
                                                                        backgroundColor: `${issue.label.color}18`,
                                                                        color: issue.label.color,
                                                                    }}
                                                                >
                                                                    {issue.label.name}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-2">
                                                            <div className="flex -space-x-1">
                                                                {issue.assignees.slice(0, 3).map(assignee => (
                                                                    <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                                                                        <AvatarImage src={assignee.avatar || undefined} />
                                                                        <AvatarFallback className="text-xs">
                                                                            {assignee.name?.[0] || '?'}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                ))}
                                                                {issue.assignees.length > 3 && (
                                                                    <div className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs">
                                                                        +{issue.assignees.length - 3}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
