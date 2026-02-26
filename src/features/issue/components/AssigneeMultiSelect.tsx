'use client'

import { useState } from 'react'
import { UserCircle2, X, Check, Search } from 'lucide-react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/core/components/ui/popover'
import { cn } from '@/core/utils/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AssigneeMember {
    id: string
    name: string | null
    email: string
    avatar: string | null
}

interface AssigneeMultiSelectProps {
    selectedIds: string[]
    members: AssigneeMember[]
    onSelectionChange: (ids: string[]) => void
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function MemberAvatar({ member, size = 5 }: { member: AssigneeMember; size?: number }) {
    const sizeClass = `h-${size} w-${size}`
    if (member.avatar) {
        return (
            <img
                src={member.avatar}
                alt={member.name ?? ''}
                className={cn(sizeClass, 'rounded-full object-cover shrink-0')}
            />
        )
    }
    return (
        <div className={cn(sizeClass, 'rounded-full bg-muted border border-border flex items-center justify-center shrink-0')}>
            <span className="text-[8px] font-semibold uppercase text-muted-foreground">
                {member.name?.[0] ?? member.email[0]}
            </span>
        </div>
    )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AssigneeMultiSelect({
    selectedIds,
    members,
    onSelectionChange,
}: AssigneeMultiSelectProps) {
    const [search, setSearch] = useState('')

    const selectedMembers = members.filter(m => selectedIds.includes(m.id))

    const filteredMembers = members.filter(m => {
        const q = search.toLowerCase()
        return (
            (m.name?.toLowerCase() ?? '').includes(q) ||
            m.email.toLowerCase().includes(q)
        )
    })

    const toggle = (id: string) => {
        onSelectionChange(
            selectedIds.includes(id)
                ? selectedIds.filter(i => i !== id)
                : [...selectedIds, id]
        )
    }

    const remove = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        onSelectionChange(selectedIds.filter(i => i !== id))
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium border border-border bg-background text-foreground hover:bg-muted transition-all"
                >
                    {/* Show stacked avatars if selected, otherwise icon */}
                    {selectedMembers.length > 0 ? (
                        <div className="flex -space-x-1.5 mr-0.5">
                            {selectedMembers.slice(0, 3).map(m => (
                                <MemberAvatar key={m.id} member={m} size={4} />
                            ))}
                        </div>
                    ) : (
                        <UserCircle2 className="h-3.5 w-3.5" />
                    )}

                    <span>
                        {selectedMembers.length > 0
                            ? selectedMembers.length === 1
                                ? (selectedMembers[0].name ?? selectedMembers[0].email.split('@')[0])
                                : `${selectedMembers.length} assignees`
                            : 'Assignee'
                        }
                    </span>
                </button>
            </PopoverTrigger>

            <PopoverContent
                align="start"
                sideOffset={6}
                className="w-72 p-0 rounded-lg shadow-lg overflow-hidden"
            >
                {/* ── Search ── */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
                    <Search className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                    <input
                        autoFocus
                        type="text"
                        placeholder="Search members…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                    />
                    {search && (
                        <button type="button" onClick={() => setSearch('')}>
                            <X className="h-3 w-3 text-muted-foreground/50 hover:text-foreground transition-colors" />
                        </button>
                    )}
                </div>

                {/* ── Selected chips ── */}
                {selectedMembers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 px-3 py-2.5 border-b border-border/50">
                        {selectedMembers.map(m => (
                            <span
                                key={m.id}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium bg-muted text-foreground border border-border/60"
                            >
                                <MemberAvatar member={m} size={3} />
                                <span className="max-w-[100px] truncate">
                                    {m.name ?? m.email.split('@')[0]}
                                </span>
                                <button
                                    type="button"
                                    onClick={e => remove(m.id, e)}
                                    className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="h-2.5 w-2.5" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* ── Member list ── */}
                <div className="max-h-56 overflow-y-auto p-1">
                    {filteredMembers.length === 0 ? (
                        <div className="py-6 text-center text-xs text-muted-foreground/50">
                            {search ? 'No members found' : 'No members available'}
                        </div>
                    ) : (
                        filteredMembers.map(member => {
                            const isSelected = selectedIds.includes(member.id)
                            return (
                                <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => toggle(member.id)}
                                    className={cn(
                                        'w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-left transition-colors',
                                        isSelected
                                            ? 'bg-muted text-foreground'
                                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                                    )}
                                >
                                    <MemberAvatar member={member} size={5} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate text-foreground">
                                            {member.name ?? member.email.split('@')[0]}
                                        </p>
                                        {member.name && (
                                            <p className="text-[10px] text-muted-foreground truncate">
                                                {member.email}
                                            </p>
                                        )}
                                    </div>
                                    {isSelected && (
                                        <Check className="h-3 w-3 shrink-0 text-muted-foreground" />
                                    )}
                                </button>
                            )
                        })
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}