'use client'

import { use } from 'react'
import { KanbanBoard } from '@/features/kanban/components/KanbanBoard'

interface PageProps {
    params: Promise<{ tenantId: string; projectId: string; boardId: string }>
}

export default function BoardPage({ params }: PageProps) {
    const { tenantId, projectId, boardId } = use(params)
   

    return (
        <div className="h-full flex flex-col overflow-hidden bg-background">
            <KanbanBoard
                orgId={tenantId}
                projectId={projectId}
                boardId={boardId}
                canManage={true}
            />
        </div>
    )
}