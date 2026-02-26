'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { KanbanBoard } from '@/features/kanban/components/KanbanBoard'
import { useProjectLabels } from '@/features/projects/settings/hooks/useProjectLabel'
import { useProjectPriorities } from '@/features/projects/settings/hooks/Useprojectpriorities'
import { useBoard } from '@/features/kanban/hooks/hooks'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface PageProps {
    params: Promise<{ tenantId: string; projectId: string; boardId: string }>
}

export default function BoardPage({ params }: PageProps) {
    const { tenantId, projectId, boardId } = use(params)
    const router = useRouter()
    const [hasRedirected, setHasRedirected] = useState(false)

    // Check board access first
    const { board, loading: boardLoading, error: boardError } = useBoard(tenantId, projectId, boardId)

    // Fetch project labels and priorities once at page level
    const { labels, fetch: fetchLabels } = useProjectLabels(tenantId, projectId)
    const { priorities, fetch: fetchPriorities } = useProjectPriorities(tenantId, projectId)

    useEffect(() => {
        fetchLabels()
        fetchPriorities()
    }, [fetchLabels, fetchPriorities])

    // Redirect if user doesn't have access to the board
    useEffect(() => {
        if (!hasRedirected && boardError && (
            boardError.includes('Forbidden') || 
            boardError.includes('not a project member') ||
            boardError.includes('Board not found')
        )) {
            setHasRedirected(true)
            toast.error('Access denied', {
                description: 'You do not have permission to access this board.'
            })
            router.replace(`/app/${tenantId}`)
        }
    }, [boardError, router, tenantId, hasRedirected])

    // Show loading state while checking access or redirecting
    if (boardLoading || hasRedirected) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Don't render the board if there's an access error
    if (boardError && (
        boardError.includes('Forbidden') || 
        boardError.includes('not a project member') ||
        boardError.includes('Board not found')
    )) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex flex-col flex-1 min-h-0 bg-background overflow-hidden">
            <KanbanBoard
                orgId={tenantId}
                projectId={projectId}
                boardId={boardId}
                labels={labels}
                priorities={priorities}
                canManage={true}
            />
        </div>
    )
}