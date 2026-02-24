// src/features/dashboard/components/ColumnsChart.tsx
"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis } from "recharts";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/core/components/ui/chart";
import { IChart } from "../types/types";

const chartConfig = {
    tasks: {
        label: "Issues",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig;

export function ColumnsChart({ chartData }: { chartData: IChart[] }) {
    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-[160px] text-sm text-muted-foreground">
                No columns in this board
            </div>
        );
    }

    return (
        <>
            <ChartContainer config={chartConfig} className="w-full max-w-full cursor-pointer">
                <BarChart data={chartData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                        dataKey="columnTitle"
                        tickLine={false}
                        tickMargin={6}
                        axisLine={false}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value: string) => value.slice(0, 4).toUpperCase()}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="tasks" radius={6} barSize={30}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ChartContainer>
            <div className="text-sm text-muted-foreground pt-2">
                Number of issues in each column
            </div>
        </>
    );
}