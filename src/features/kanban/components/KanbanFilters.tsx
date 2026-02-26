'use client'

import { useState } from 'react'
import { Filter, X, Calendar as CalendarIcon, Tag, Flag, User, Clock } from 'lucide-react'
import { Button } from '@/core/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/core/components/ui/select'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/core/components/ui/popover'
import { Calendar } from '@/core/components/ui/calendar'
import { Badge } from '@/core/components/ui/badge'
import { format } from 'date-fns'
import type { Label, Priority } from '../types/types'

export interface KanbanFiltersState {
    labelId: string | null
    priorityId: string | null
    assigneeId: string | null
    dueDateFrom: Date | null
    dueDateTo: Date | null
}

interface KanbanFiltersProps {
    labels: Label[]
    priorities: Priority[]
    members: Array<{ id: string; name: string | null; email: string; avatar: string | null }>
    filters: KanbanFiltersState
    onFiltersChange: (filters: KanbanFiltersState) => void
}

export function KanbanFilters({
    labels,
    priorities,
    members,
    filters,
    onFiltersChange,
}: KanbanFiltersProps) {
    const [isOpen, setIsOpen] = useState(false)

    const activeFiltersCount = [
        filters.labelId,
        filters.priorityId,
        filters.assigneeId,
        filters.dueDateFrom,
        filters.dueDateTo,
    ].filter(Boolean).length

    const handleClearAll = () => {
        onFiltersChange({
            labelId: null,
            priorityId: null,
            assigneeId: null,
            dueDateFrom: null,
            dueDateTo: null,
        })
    }

    const handleLabelChange = (value: string) => {
        onFiltersChange({
            ...filters,
            labelId: value === 'all' ? null : value,
        })
    }

    const handlePriorityChange = (value: string) => {
        onFiltersChange({
            ...filters,
            priorityId: value === 'all' ? null : value,
        })
    }

    const handleAssigneeChange = (value: string) => {
        onFiltersChange({
            ...filters,
            assigneeId: value === 'all' ? null : value,
        })
    }

    const handleDueDateFromChange = (date: Date | undefined) => {
        onFiltersChange({
            ...filters,
            dueDateFrom: date || null,
        })
    }

    const handleDueDateToChange = (date: Date | undefined) => {
        onFiltersChange({
            ...filters,
            dueDateTo: date || null,
        })
    }

    const selectedLabel = labels.find(l => l.id === filters.labelId)
    const selectedPriority = priorities.find(p => p.id === filters.priorityId)
    const selectedAssignee = members.find(m => m.id === filters.assigneeId)

    return (
        <div className="flex items-center gap-2">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-2">
                        <Filter className="h-3.5 w-3.5" />
                        Filters
                        {activeFiltersCount > 0 && (
                            <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-1">
                                {activeFiltersCount}
                            </Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-4" align="start">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm">Filter Issues</h4>
                            {activeFiltersCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearAll}
                                    className="h-7 text-xs"
                                >
                                    Clear all
                                </Button>
                            )}
                        </div>

                        {/* Label Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium flex items-center gap-1.5">
                                <Tag className="h-3 w-3" />
                                Label
                            </label>
                            <Select
                                value={filters.labelId || 'all'}
                                onValueChange={handleLabelChange}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="All labels" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All labels</SelectItem>
                                    {labels.map((label) => (
                                        <SelectItem key={label.id} value={label.id}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="h-2 w-2 rounded-full"
                                                    style={{ backgroundColor: label.color }}
                                                />
                                                {label.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Priority Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium flex items-center gap-1.5">
                                <Flag className="h-3 w-3" />
                                Priority
                            </label>
                            <Select
                                value={filters.priorityId || 'all'}
                                onValueChange={handlePriorityChange}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="All priorities" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All priorities</SelectItem>
                                    {priorities.map((priority) => (
                                        <SelectItem key={priority.id} value={priority.id}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="h-2 w-2 rounded-full"
                                                    style={{ backgroundColor: priority.color }}
                                                />
                                                {priority.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Assignee Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium flex items-center gap-1.5">
                                <User className="h-3 w-3" />
                                Assignee
                            </label>
                            <Select
                                value={filters.assigneeId || 'all'}
                                onValueChange={handleAssigneeChange}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="All assignees" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All assignees</SelectItem>
                                    {members.map((member) => (
                                        <SelectItem key={member.id} value={member.id}>
                                            {member.name || member.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Due Date Range Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium flex items-center gap-1.5">
                                <Clock className="h-3 w-3" />
                                Due Date Range
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 justify-start text-xs font-normal"
                                        >
                                            <CalendarIcon className="mr-2 h-3 w-3" />
                                            {filters.dueDateFrom
                                                ? format(filters.dueDateFrom, 'MMM dd')
                                                : 'From'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={filters.dueDateFrom || undefined}
                                            onSelect={handleDueDateFromChange}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 justify-start text-xs font-normal"
                                        >
                                            <CalendarIcon className="mr-2 h-3 w-3" />
                                            {filters.dueDateTo
                                                ? format(filters.dueDateTo, 'MMM dd')
                                                : 'To'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={filters.dueDateTo || undefined}
                                            onSelect={handleDueDateToChange}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Active Filter Badges */}
            {selectedLabel && (
                <Badge variant="secondary" className="h-6 gap-1 text-xs">
                    <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: selectedLabel.color }}
                    />
                    {selectedLabel.name}
                    <button
                        onClick={() => handleLabelChange('all')}
                        className="ml-1 hover:bg-muted rounded-full"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            )}

            {selectedPriority && (
                <Badge variant="secondary" className="h-6 gap-1 text-xs">
                    <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: selectedPriority.color }}
                    />
                    {selectedPriority.name}
                    <button
                        onClick={() => handlePriorityChange('all')}
                        className="ml-1 hover:bg-muted rounded-full"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            )}

            {selectedAssignee && (
                <Badge variant="secondary" className="h-6 gap-1 text-xs">
                    <User className="h-3 w-3" />
                    {selectedAssignee.name || selectedAssignee.email}
                    <button
                        onClick={() => handleAssigneeChange('all')}
                        className="ml-1 hover:bg-muted rounded-full"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            )}

            {(filters.dueDateFrom || filters.dueDateTo) && (
                <Badge variant="secondary" className="h-6 gap-1 text-xs">
                    <CalendarIcon className="h-3 w-3" />
                    {filters.dueDateFrom && format(filters.dueDateFrom, 'MMM dd')}
                    {filters.dueDateFrom && filters.dueDateTo && ' - '}
                    {filters.dueDateTo && format(filters.dueDateTo, 'MMM dd')}
                    <button
                        onClick={() => {
                            onFiltersChange({
                                ...filters,
                                dueDateFrom: null,
                                dueDateTo: null,
                            })
                        }}
                        className="ml-1 hover:bg-muted rounded-full"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            )}
        </div>
    )
}
