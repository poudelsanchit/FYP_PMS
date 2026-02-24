'use client'

import { AlertTriangle } from 'lucide-react'

interface IssueErrorBannerProps {
    message: string
}

export function IssueErrorBanner({ message }: IssueErrorBannerProps) {
    return (
        <div className="mx-5 mb-3 flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
            <p className="text-xs text-destructive">{message}</p>
        </div>
    )
}