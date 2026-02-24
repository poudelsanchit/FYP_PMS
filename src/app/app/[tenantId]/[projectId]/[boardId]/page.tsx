'use client'

import { use, useEffect } from 'react'
import { KanbanBoard } from '@/features/kanban/components/KanbanBoard'
import { useProjectLabels } from '@/features/projects/settings/hooks/useProjectLabel'
import { useProjectPriorities } from '@/features/projects/settings/hooks/Useprojectpriorities'

interface PageProps {
    params: Promise<{ tenantId: string; projectId: string; boardId: string }>
}

export default function BoardPage({ params }: PageProps) {
    const { tenantId, projectId, boardId } = use(params)

    // Fetch project labels and priorities once at page level
    const { labels, fetch: fetchLabels } = useProjectLabels(tenantId, projectId)
    const { priorities, fetch: fetchPriorities } = useProjectPriorities(tenantId, projectId)

    useEffect(() => {
        fetchLabels()
        fetchPriorities()
    }, [fetchLabels, fetchPriorities])

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