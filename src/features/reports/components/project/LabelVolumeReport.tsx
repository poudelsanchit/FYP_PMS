'use client'

import { Tag } from 'lucide-react'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/core/components/ui/tooltip'
import { Info } from 'lucide-react'
import {
    ChartContainer,
    ChartTooltip,
    type ChartConfig,
} from '@/core/components/ui/chart'
import { ProjectReportData } from '../../hooks/useProjectReports'
import { StatCard } from '../shared/StatCard'

interface LabelVolumeReportProps {
    data: ProjectReportData
}

export function LabelVolumeReport({ data }: LabelVolumeReportProps) {
    const chartColors = [
        'var(--color-chart-1)',
        'var(--color-chart-2)',
        'var(--color-chart-3)',
        'var(--color-chart-4)',
        'var(--color-chart-5)',
    ]

    const chartData = data.labelVolume.map((label, index) => ({
        name: label.name,
        total: label.total,
        open: label.open,
        inProgress: label.inProgress,
        completed: label.completed,
        fill: label.color || chartColors[index % chartColors.length],
        id: label.id,
    }))

    const chartConfig = {
        total: {
            label: 'Total Issues',
        },
    } satisfies ChartConfig

    const mostUsedLabel = data.labelVolume[0]
    const totalLabeled = data.labelVolume.reduce((sum, l) => sum + l.total, 0)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Issue Volume by Label</h2>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                            <p>See how many issues have each label across your whole project. Helps you understand what types of work (bugs, features, docs, etc.) you're doing the most.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Total Labels"
                    value={data.summary.totalLabels}
                    subtitle="Across project"
                />

                <StatCard
                    title="Total Labeled Issues"
                    value={totalLabeled}
                    subtitle={`${Math.round((totalLabeled / data.summary.totalIssues) * 100)}% of all issues`}
                />

                {mostUsedLabel && (
                    <StatCard
                        title="Most Used Label"
                        value={`${mostUsedLabel.total} issues`}
                        subtitle={mostUsedLabel.name}
                    />
                )}
            </div>

            {chartData.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="text-4xl mb-3">🏷️</div>
                        <h3 className="text-lg font-semibold mb-1">No Labels</h3>
                        <p className="text-sm text-muted-foreground">
                            Create labels to categorize your issues
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Issues by Label</CardTitle>
                        <CardDescription>
                            Distribution of issues across different labels
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
                                                    <div
                                                        className="w-3 h-3 rounded"
                                                        style={{ backgroundColor: data.fill }}
                                                    />
                                                    <span className="font-semibold">{data.name}</span>
                                                </div>
                                                <div className="space-y-1 text-sm">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-muted-foreground">Total:</span>
                                                        <span className="font-medium">{data.total}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-muted-foreground">Open:</span>
                                                        <span className="font-medium">{data.open}</span>
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
                                                </div>
                                            </div>
                                        )
                                    }}
                                />
                                <Bar dataKey="total" radius={[8, 8, 0, 0]}>
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
                                        <span>{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-muted-foreground">
                                        <span>{item.total} total</span>
                                        <span className="text-green-600 dark:text-green-400">
                                            {item.completed} done
                                        </span>
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
