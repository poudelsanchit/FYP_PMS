'use client'

import { use } from 'react'
import { KanbanBoard } from '@/features/kanban/components/KanbanBoard'

interface PageProps {
    params: Promise<{ tenantId: string; projectId: string; boardId: string }>
}

export default function BoardPage({ params }: PageProps) {
    const { tenantId, projectId, boardId } = use(params)


    return (
        <div className="flex flex-col flex-1 min-h-0 bg-background overflow-hidden">
            <KanbanBoard
                orgId={tenantId}
                projectId={projectId}
                boardId={boardId}
                canManage={true}
            />
        </div>
    )
}