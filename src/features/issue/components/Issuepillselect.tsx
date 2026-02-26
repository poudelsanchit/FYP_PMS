'use client'

import { ChevronDown, Check } from 'lucide-react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/core/components/ui/popover'
import { cn } from '@/core/utils/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PillOption {
    id: string
    name: string
    color?: string
}

interface IssuePillSelectProps {
    value: string
    options: PillOption[]
    placeholder: string
    icon: React.ReactNode
    onChange: (id: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function IssuePillSelect({
    value,
    options,
    placeholder,
    icon,
    onChange,
}: IssuePillSelectProps) {
    const selected = options.find(o => o.id === value)

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium border border-border bg-background text-foreground hover:bg-muted transition-all"
                >
                    {selected?.color ? (
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: selected.color }} />
                    ) : (
                        <span className="shrink-0">{icon}</span>
                    )}
                    <span>{selected?.name ?? placeholder}</span>
                    <ChevronDown className="h-3 w-3" />
                </button>
            </PopoverTrigger>

            <PopoverContent
                align="start"
                sideOffset={6}
                className="w-44 p-1 rounded-lg shadow-lg"
            >
                {/* None option */}
                <button
                    type="button"
                    onClick={() => onChange('')}
                    className={cn(
                        'w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs text-left transition-colors hover:bg-muted',
                        !value ? 'text-foreground font-semibold bg-muted/50' : 'text-foreground'
                    )}
                >
                    <span>None</span>
                    {!value && <Check className="h-3 w-3 shrink-0" />}
                </button>

                {/* Divider */}
                <div className="my-1 h-px bg-border/50" />

                {options.map(opt => (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChange(opt.id)}
                        className={cn(
                            'w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs text-left transition-colors hover:bg-muted',
                            value === opt.id ? 'text-foreground font-semibold bg-muted/50' : 'text-foreground'
                        )}
                    >
                        <span className="flex items-center gap-2">
                            {opt.color && (
                                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                            )}
                            {opt.name}
                        </span>
                        {value === opt.id && <Check className="h-3 w-3 shrink-0" />}
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    )
}