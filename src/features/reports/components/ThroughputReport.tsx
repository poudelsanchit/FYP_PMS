'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import { Bar, CartesianGrid, XAxis, YAxis, Line, ComposedChart, Cell, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card'
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
import { BoardReportData } from '../hooks/useBoardReports'
import { StatCard } from './shared/StatCard'

interface ThroughputReportProps {
    data: BoardReportData
}

type ViewBy = 'daily' | 'weekly' | 'monthly'

export function ThroughputReport({ data }: ThroughputReportProps) {
    const [viewBy, setViewBy] = useState<ViewBy>('weekly')

    // ─── Derived chart data based on selected view ─────────────────────────

    const rawData =
        viewBy === 'daily'
            ? data.throughput.daily.map((d) => ({ label: d.day, count: d.count }))
            : viewBy === 'weekly'
            ? data.throughput.weekly.map((w) => ({ label: w.week, count: w.count }))
            : data.throughput.monthly.map((m) => ({ label: m.month, count: m.count }))

    // Rolling average window: 7 days for daily, 3 for weekly/monthly
    const windowSize = viewBy === 'daily' ? 7 : 3

    const chartData = rawData.map((item, index) => {
        const start = Math.max(0, index - windowSize + 1)
        const window = rawData.slice(start, index + 1)
        const rollingAvg =
            window.reduce((sum, w) => sum + w.count, 0) / window.length
        return {
            label: item.label,
            count: item.count,
            average: Math.round(rollingAvg * 10) / 10,
        }
    })

    const chartConfig = {
        count: {
            label: 'Completed',
            color: 'var(--chart-1)',
        },
        average: {
            label: 'Rolling Avg',
            color: 'var(--chart-3)',
        },
    } satisfies ChartConfig

    // ─── Stats ─────────────────────────────────────────────────────────────

    // "This period" = last bar, "Previous period" = second to last bar
    const currentCount = chartData[chartData.length - 1]?.count ?? 0
    const previousCount = chartData[chartData.length - 2]?.count ?? 0
    const percentChange =
        previousCount > 0
            ? Math.round(((currentCount - previousCount) / previousCount) * 100)
            : 0

    const avgValue =
        viewBy === 'daily'
            ? data.throughput.averageDaily
            : viewBy === 'weekly'
            ? data.throughput.averageWeekly
            : data.throughput.averageMonthly

    const periodLabel =
        viewBy === 'daily' ? 'Day' : viewBy === 'weekly' ? 'Week' : 'Month'
    const periodLabelPlural =
        viewBy === 'daily' ? 'days' : viewBy === 'weekly' ? 'weeks' : 'months'
    const periodCount =
        viewBy === 'daily' ? 30 : viewBy === 'weekly' ? 12 : 6

    const hasData = chartData.some((d) => d.count > 0)

    // Calculate velocity trend based on first half vs second half
    const calculateTrend = () => {
        if (chartData.length < 4) return 'stable'
        const midpoint = Math.floor(chartData.length / 2)
        const firstHalf = chartData.slice(0, midpoint)
        const secondHalf = chartData.slice(midpoint)
        
        const firstAvg = firstHalf.reduce((sum, d) => sum + d.count, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((sum, d) => sum + d.count, 0) / secondHalf.length
        
        const changePercent = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0
        
        if (changePercent > 10) return 'improving'
        if (changePercent < -10) return 'declining'
        return 'stable'
    }

    const trend = calculateTrend()

    const TrendIcon =
        trend === 'improving'
            ? TrendingUp
            : trend === 'declining'
            ? TrendingDown
            : Minus

    const trendColor =
        trend === 'improving'
            ? 'text-green-500'
            : trend === 'declining'
            ? 'text-red-500'
            : 'text-muted-foreground'

    const trendLabel =
        trend === 'improving'
            ? `Velocity improving over the last ${periodCount} ${periodLabelPlural}`
            : trend === 'declining'
            ? `Velocity declining over the last ${periodCount} ${periodLabelPlural}`
            : 'Velocity is stable'

    // ─── X-axis tick interval to avoid crowding ────────────────────────────
    // Daily has 30 bars — show every 5th label
    // Weekly has 12 bars — show every 2nd label
    // Monthly has 12 bars — show every 2nd label
    const tickInterval =
        viewBy === 'daily' ? 4 : 1 // 0-indexed: 4 means every 5th

    return (
        <div className="space-y-6">

            {/* Header + Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Throughput Analysis</h2>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                <p>Shows how many issues your team finishes each day, week, or month. The dotted line shows the average trend to help you see the real pattern. Use this to predict when you'll finish work and spot when things slow down.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">View by:</span>
                    {(['daily', 'weekly', 'monthly'] as ViewBy[]).map((v) => (
                        <Button
                            key={v}
                            variant={viewBy === v ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewBy(v)}
                            className="capitalize"
                        >
                            {v}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title={`This ${periodLabel}`}
                    value={`${currentCount} issues`}
                    trend={
                        percentChange !== 0
                            ? {
                                  value: percentChange,
                                  label: `vs last ${periodLabel.toLowerCase()}`,
                              }
                            : undefined
                    }
                    variant={
                        percentChange > 0
                            ? 'success'
                            : percentChange < 0
                            ? 'warning'
                            : 'default'
                    }
                />
                <StatCard
                    title={`Last ${periodLabel}`}
                    value={`${previousCount} issues`}
                />
                <StatCard
                    title={`Avg per ${periodLabel}`}
                    value={`${avgValue} issues`}
                    subtitle={`Last ${periodCount} ${periodLabel.toLowerCase()}s`}
                />
            </div>

            {/* Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Completed Issues Per {periodLabel}</CardTitle>
                    <CardDescription>
                        {viewBy === 'daily' && 'Last 30 days including today'}
                        {viewBy === 'weekly' && 'Last 12 weeks including this week'}
                        {viewBy === 'monthly' && 'Last 12 months including this month'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!hasData ? (
                        <div className="flex flex-col items-center justify-center h-[300px]">
                            <div className="text-4xl mb-3">📭</div>
                            <h3 className="text-lg font-semibold mb-1">
                                No completed issues yet
                            </h3>
                            <p className="text-sm text-muted-foreground text-center max-w-md">
                                Issues will appear here once they are moved to a completed
                                column.
                            </p>
                        </div>
                    ) : (
                        <>
                            <ChartContainer
                                config={chartConfig}
                                className="h-[300px] w-full"
                            >
                                <ComposedChart
                                    data={chartData}
                                    margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
                                >
                                    <CartesianGrid
                                        vertical={false}
                                        strokeDasharray="3 3"
                                        className="stroke-muted"
                                    />
                                    <XAxis
                                        dataKey="label"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontSize: 11 }}
                                        // Rotate daily labels to prevent overlap
                                        angle={viewBy === 'daily' ? -45 : 0}
                                        textAnchor={viewBy === 'daily' ? 'end' : 'middle'}
                                        height={viewBy === 'daily' ? 70 : 30}
                                        interval={tickInterval}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontSize: 11 }}
                                        allowDecimals={false}
                                        width={30}
                                    />
                                    {/* Average reference line across the whole chart */}
                                    <ReferenceLine
                                        y={avgValue}
                                        stroke="var(--muted-foreground)"
                                        strokeDasharray="4 4"
                                        strokeOpacity={0.4}
                                    />
                                    <ChartTooltip
                                        content={({ active, payload }) => {
                                            if (!active || !payload?.length) return null
                                            const d = payload[0].payload
                                            return (
                                                <div className="rounded-lg border bg-background p-3 shadow-md text-sm min-w-[160px]">
                                                    <div className="font-semibold mb-2">
                                                        {d.label}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-muted-foreground">
                                                                Completed
                                                            </span>
                                                            <span className="font-medium">
                                                                {d.count} issues
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-muted-foreground">
                                                                Rolling avg
                                                            </span>
                                                            <span className="font-medium">
                                                                {d.average}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-muted-foreground">
                                                                Period avg
                                                            </span>
                                                            <span className="font-medium">
                                                                {avgValue}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        fill="var(--chart-1)"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={40}
                                    >
                                        {chartData.map((entry, index) => {
                                            // Highlight the most recent bar slightly brighter
                                            const isLast = index === chartData.length - 1
                                            return (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={
                                                        isLast
                                                            ? 'var(--chart-1)'
                                                            : 'var(--chart-2)'
                                                    }
                                                    opacity={isLast ? 1 : 0.7}
                                                />
                                            )
                                        })}
                                    </Bar>
                                    <Line
                                        type="monotone"
                                        dataKey="average"
                                        stroke="var(--chart-3)"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                </ComposedChart>
                            </ChartContainer>

                            {/* Legend */}
                            <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded"
                                        style={{ backgroundColor: 'var(--chart-1)' }}
                                    />
                                    <span>Completed Issues</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-8 border-t-2 border-dashed"
                                        style={{ borderColor: 'var(--chart-3)' }}
                                    />
                                    <span>Rolling Average</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-8 border-t-2 border-dashed opacity-40"
                                        style={{ borderColor: 'var(--muted-foreground)' }}
                                    />
                                    <span>Period Average ({avgValue})</span>
                                </div>
                            </div>

                            {/* Velocity trend */}
                            {hasData && (
                                <div
                                    className={`mt-4 flex items-center gap-2 text-sm font-medium ${trendColor}`}
                                >
                                    <TrendIcon className="h-4 w-4" />
                                    {trendLabel}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}