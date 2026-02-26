'use client'

import { ChevronDown } from 'lucide-react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/core/components/ui/popover'
import { cn } from '@/core/utils/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StatusOption {
    id: string
    name: string
    color: string
}

interface IssueStatusPillProps {
    value: string
    options: StatusOption[]
    onChange: (id: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function IssueStatusPill({ value, options, onChange }: IssueStatusPillProps) {
    const selected = options.find(o => o.id === value) ?? options[0]

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium border border-border bg-background text-foreground hover:bg-muted transition-all"
                >
                    <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: selected?.color ?? '#6b7280' }}
                    />
                    {selected?.name ?? 'Status'}
                    <ChevronDown className="h-3 w-3" />
                </button>
            </PopoverTrigger>

            <PopoverContent
                align="start"
                sideOffset={6}
                className="w-44 p-1 rounded-lg shadow-lg"
            >
                {options.map(opt => (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChange(opt.id)}
                        className={cn(
                            'w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-left transition-colors hover:bg-muted',
                            value === opt.id ? 'text-foreground font-semibold bg-muted/50' : 'text-foreground'
                        )}
                    >
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                        {opt.name}
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    )
}