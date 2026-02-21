'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronsUpDown, X, Loader2 } from 'lucide-react'
import { Button } from '@/core/components/ui/button'
import { Input } from '@/core/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/core/components/ui/avatar'
import { Badge } from '@/core/components/ui/badge'
import { cn } from '@/core/utils/utils'
import { useOrgMembers, OrgMember } from '../hooks/useOrgMembers'

interface MemberMultiSelectProps {
    orgId: string
    selectedUserIds: string[]
    onSelectionChange: (userIds: string[]) => void
    excludeUserIds?: string[]
    disabled?: boolean
}

const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    return email[0].toUpperCase()
}

export const MemberMultiSelect = ({
    orgId,
    selectedUserIds,
    onSelectionChange,
    excludeUserIds = [],
    disabled = false,
}: MemberMultiSelectProps) => {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const dropdownRef = useRef<HTMLDivElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    const { members, pagination, isLoading, isLoadingMore, loadMore } = useOrgMembers(orgId, debouncedSearch)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
        }, 300)
        return () => clearTimeout(timer)
    }, [search])

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Infinite scroll
    useEffect(() => {
        const scrollElement = scrollRef.current
        if (!scrollElement) return

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = scrollElement
            if (scrollHeight - scrollTop <= clientHeight * 1.5 && pagination?.hasMore && !isLoadingMore) {
                loadMore()
            }
        }

        scrollElement.addEventListener('scroll', handleScroll)
        return () => scrollElement.removeEventListener('scroll', handleScroll)
    }, [pagination, isLoadingMore, loadMore])

    const availableMembers = members.filter(
        m => !excludeUserIds.includes(m.user.id)
    )

    const selectedMembers = members.filter(m => selectedUserIds.includes(m.user.id))

    const toggleMember = (userId: string) => {
        if (selectedUserIds.includes(userId)) {
            onSelectionChange(selectedUserIds.filter(id => id !== userId))
        } else {
            onSelectionChange([...selectedUserIds, userId])
        }
    }

    const removeMember = (userId: string) => {
        onSelectionChange(selectedUserIds.filter(id => id !== userId))
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Selected members display */}
            {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedMembers.map(member => (
                        <Badge
                            key={member.user.id}
                            variant="secondary"
                            className="pl-1 pr-1.5 py-0.5 gap-1"
                        >
                            <Avatar className="h-4 w-4">
                                <AvatarImage src={member.user.avatar ?? undefined} />
                                <AvatarFallback className="text-[8px]">
                                    {getInitials(member.user.name, member.user.email)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">
                                {member.user.name || member.user.email}
                            </span>
                            <button
                                onClick={() => removeMember(member.user.id)}
                                className="hover:text-destructive"
                                disabled={disabled}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            {/* Trigger button */}
            <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                onClick={() => setOpen(!open)}
                disabled={disabled}
            >
                <span className="text-muted-foreground">
                    {selectedUserIds.length > 0
                        ? `${selectedUserIds.length} member${selectedUserIds.length > 1 ? 's' : ''} selected`
                        : 'Select members...'}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                    <div className="p-2 border-b">
                        <Input
                            placeholder="Search members..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8"
                            autoFocus
                        />
                    </div>

                    <div
                        ref={scrollRef}
                        className="max-h-[240px] overflow-y-auto p-1"
                    >
                        {isLoading && !isLoadingMore ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        ) : availableMembers.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                {search ? 'No members found' : 'All members already invited'}
                            </div>
                        ) : (
                            <>
                                {availableMembers.map((member) => {
                                    const isSelected = selectedUserIds.includes(member.user.id)
                                    return (
                                        <button
                                            key={member.user.id}
                                            onClick={() => toggleMember(member.user.id)}
                                            className={cn(
                                                'relative flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                                                isSelected && 'bg-accent'
                                            )}
                                        >
                                            <Avatar className="h-6 w-6 shrink-0">
                                                <AvatarImage src={member.user.avatar ?? undefined} />
                                                <AvatarFallback className="text-[10px]">
                                                    {getInitials(member.user.name, member.user.email)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 text-left min-w-0">
                                                <p className="font-medium truncate">
                                                    {member.user.name || member.user.email}
                                                </p>
                                                {member.user.name && (
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {member.user.email}
                                                    </p>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <Check className="h-4 w-4 shrink-0" />
                                            )}
                                        </button>
                                    )
                                })}
                                {isLoadingMore && (
                                    <div className="flex items-center justify-center py-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                                {pagination && !pagination.hasMore && availableMembers.length > 0 && (
                                    <div className="py-2 text-center text-xs text-muted-foreground">
                                        All members loaded
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
