'use client'

import { useState } from 'react'
import { LayoutGrid, Flag, Tag, ChevronDown } from 'lucide-react'
import { Button } from '@/core/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/core/components/ui/popover'
import { cn } from '@/core/utils/utils'

export type GroupByOption = 'status' | 'priority' | 'label'

interface KanbanGroupByProps {
    value: GroupByOption
    onChange: (value: GroupByOption) => void
}

export function KanbanGroupBy({ value, onChange }: KanbanGroupByProps) {
    const [open, setOpen] = useState(false)

    const options = [
        { value: 'status' as const, label: 'Status', icon: LayoutGrid },
        { value: 'priority' as const, label: 'Priority', icon: Flag },
        { value: 'label' as const, label: 'Label', icon: Tag },
    ]

    const selected = options.find(o => o.value === value)
    const Icon = selected?.icon || LayoutGrid

    const handleSelect = (newValue: GroupByOption) => {
        onChange(newValue)
        setOpen(false)
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Group by:</span>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
                        <Icon className="h-3.5 w-3.5" />
                        <span>{selected?.label}</span>
                        <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[110px] p-1" align="start">
                    <div className="space-y-0.5">
                        {options.map((option) => {
                            const OptionIcon = option.icon
                            const isSelected = option.value === value
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={cn(
                                        "w-full  cursor-pointer flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm transition-colors",
                                        "hover:bg-accent hover:text-accent-foreground",
                                        isSelected && "bg-accent text-accent-foreground"
                                    )}
                                >
                                    <OptionIcon className="h-3.5 w-3.5" />
                                    {option.label}
                                </button>
                            )
                        })}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
