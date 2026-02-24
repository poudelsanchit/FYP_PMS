'use client'

import { useState, useRef, useEffect } from 'react'
import { UserCircle2, X, ChevronDown } from 'lucide-react'

interface Member {
    id: string
    name: string | null
    email: string
    avatar: string | null
}

interface AssigneeMultiSelectProps {
    selectedIds: string[]
    members: Member[]
    onSelectionChange: (ids: string[]) => void
}

export function AssigneeMultiSelect({
    selectedIds,
    members,
    onSelectionChange,
}: AssigneeMultiSelectProps) {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const selectedMembers = members.filter(m => selectedIds.includes(m.id))
    const unselectedMembers = members.filter(m => !selectedIds.includes(m.id))

    const filteredMembers = unselectedMembers.filter(m =>
        (m.name?.toLowerCase() ?? '').includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleToggleMember = (memberId: string) => {
        if (selectedIds.includes(memberId)) {
            onSelectionChange(selectedIds.filter(id => id !== memberId))
        } else {
            onSelectionChange([...selectedIds, memberId])
        }
        // Keep dropdown open after selection
    }

    const handleRemoveMember = (memberId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        onSelectionChange(selectedIds.filter(id => id !== memberId))
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        if (open) {
            // Use a small delay to avoid immediate closure
            const timer = setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside)
            }, 0)
            setTimeout(() => inputRef.current?.focus(), 0)
            return () => clearTimeout(timer)
        }

        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [open])

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border transition-all"
            >
                <UserCircle2 className="h-3.5 w-3.5 opacity-60" />
                <span>Members</span>
                {selectedIds.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded bg-primary/20 text-primary text-xs font-semibold">
                        {selectedIds.length}
                    </span>
                )}
                <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute top-full left-0 mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                        {/* Search input */}
                        <div className="p-3 border-b border-border/50">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search members..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-muted/50 border border-border/50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        {/* Selected members */}
                        {selectedMembers.length > 0 && (
                            <>
                                <div className="px-3 py-2 border-b border-border/50">
                                    <div className="text-xs font-semibold text-muted-foreground mb-2">Selected</div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedMembers.map(member => (
                                            <div
                                                key={member.id}
                                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                                            >
                                                {member.avatar && (
                                                    <img src={member.avatar} alt="" className="h-4 w-4 rounded-full" />
                                                )}
                                                {!member.avatar && <UserCircle2 className="h-4 w-4" />}
                                                <span className="max-w-[120px] truncate">{member.name || member.email.split('@')[0]}</span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleRemoveMember(member.id, e)}
                                                    className="ml-1 hover:opacity-70 transition-opacity"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Available members */}
                        <div className="max-h-64 overflow-y-auto">
                            {filteredMembers.length > 0 ? (
                                filteredMembers.map(member => (
                                    <button
                                        key={member.id}
                                        type="button"
                                        onClick={() => handleToggleMember(member.id)}
                                        className="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors flex items-center gap-3 border-b border-border/30 last:border-b-0"
                                    >
                                        {member.avatar && (
                                            <img src={member.avatar} alt="" className="h-5 w-5 rounded-full shrink-0" />
                                        )}
                                        {!member.avatar && <UserCircle2 className="h-5 w-5 shrink-0 text-muted-foreground" />}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium truncate">{member.name || member.email}</div>
                                            {member.name && <div className="text-xs text-muted-foreground truncate">{member.email}</div>}
                                        </div>
                                        <div className="h-4 w-4 rounded border border-border/60 shrink-0 flex items-center justify-center">
                                            {selectedIds.includes(member.id) && (
                                                <div className="h-3 w-3 rounded-sm bg-primary" />
                                            )}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                                    {searchQuery ? 'No members found' : 'All members selected'}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
