import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/core/utils/utils'

interface StatCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon?: LucideIcon
    trend?: {
        value: number
        label: string
    }
    variant?: 'default' | 'success' | 'warning' | 'danger'
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: StatCardProps) {
    const variantStyles = {
        default: 'text-foreground',
        success: 'text-green-600 dark:text-green-400',
        warning: 'text-orange-600 dark:text-orange-400',
        danger: 'text-red-600 dark:text-red-400',
    }

    const trendColor = trend && trend.value > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4" />}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className={cn('text-2xl font-bold', variantStyles[variant])}>
                    {value}
                </div>
                {subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                )}
                {trend && (
                    <p className={cn('text-xs font-medium mt-1', trendColor)}>
                        {trend.value > 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
