'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, MoreHorizontal, Trash2 } from 'lucide-react'
import {
    SidebarMenuSubItem,
    SidebarMenuSubButton,
    SidebarMenuAction,
} from '@/core/components/ui/sidebar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu'
import { useBoards } from '../hooks/useBoards'
import type { Board } from '../hooks/useBoards'
import { DeleteBoardDialog } from './DeleteBoard'

interface BoardsListProps {
    orgId: string
    projectId: string
    projectColor: string
    canCreate: boolean
    onCreateClick: () => void
}

export function BoardsList({
    orgId,
    projectId,
    projectColor,
    canCreate,
    onCreateClick,
}: BoardsListProps) {
    const { boards, isLoading, error, refetch, removeBoard } = useBoards(orgId, projectId)

    const [deleteTarget, setDeleteTarget] = useState<Board | null>(null)

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-2 py-1.5">
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/50 shrink-0" />
                <span className="text-[11px] text-muted-foreground/50">Loading…</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 px-2 py-1.5">
                <AlertCircle className="h-3 w-3 text-destructive/60 shrink-0" />
                <button
                    onClick={refetch}
                    className="text-[11px] text-muted-foreground/60 hover:text-foreground underline underline-offset-2 transition-colors"
                >
                    Failed to load — retry
                </button>
            </div>
        )
    }

    if (boards.length === 0) {
        return (
            <div className="px-2 py-0.5">
                <span className="text-[11px] text-muted-foreground/50 italic">
                    No boards yet
                </span>
            </div>
        )
    }

    return (
        <>
            {boards.map((board) => (
                <SidebarMenuSubItem key={board.id} className="group/board">
                    <SidebarMenuSubButton asChild>
                        <Link
                            href={`/organizations/${orgId}/projects/${projectId}/boards/${board.id}`}
                            className="flex items-center gap-2"
                        >
                            <span className="truncate">{board.name}</span>
                        </Link>
                    </SidebarMenuSubButton>

                    {canCreate && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuAction
                                    showOnHover
                                    className="opacity-0 group-hover/board:opacity-100"
                                >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                    <span className="sr-only">Board options</span>
                                </SidebarMenuAction>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="right" align="start" className="w-40">
                                <DropdownMenuItem
                                    className="gap-2 text-xs text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                                    onSelect={() => setDeleteTarget(board)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete board
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </SidebarMenuSubItem>
            ))}

            {deleteTarget && (
                <DeleteBoardDialog
                    open={!!deleteTarget}
                    onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
                    orgId={orgId}
                    projectId={projectId}
                    boardId={deleteTarget.id}
                    boardName={deleteTarget.name}
                    onDeleted={removeBoard}
                />
            )}
        </>
    )
}