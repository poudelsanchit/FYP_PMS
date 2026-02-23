'use client'

import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/core/components/ui/button'
import { Separator } from '@/core/components/ui/separator'

interface SettingsSectionProps {
    icon: React.ReactNode
    title: string
    description: string
    isLoading: boolean
    error: string | null
    onRetry: () => void
    children: React.ReactNode
}

export function SettingsSection({
    icon,
    title,
    description,
    isLoading,
    error,
    onRetry,
    children,
}: SettingsSectionProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md border bg-muted/50 shrink-0 text-muted-foreground">
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-medium leading-none">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
            </div>

            <Separator />

            <div className="space-y-0.5 pl-1">
                {isLoading ? (
                    <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Loading…
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-2 py-2 text-xs text-destructive">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span className="flex-1">{error}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-destructive hover:text-destructive px-1.5"
                            onClick={onRetry}
                        >
                            Retry
                        </Button>
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    )
}