'use client'

import { useState, useCallback } from 'react'

interface UseRenameBoardReturn {
    isRenaming: boolean
    error: string | null
    renameBoard: (orgId: string, projectId: string, boardId: string, name: string) => Promise<boolean>
}

export function useRenameBoard(): UseRenameBoardReturn {
    const [isRenaming, setIsRenaming] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const renameBoard = useCallback(
        async (orgId: string, projectId: string, boardId: string, name: string): Promise<boolean> => {
            setIsRenaming(true)
            setError(null)
            try {
                const res = await fetch(
                    `/api/organizations/${orgId}/projects/${projectId}/boards/${boardId}`,
                    {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name }),
                    }
                )
                const json = await res.json()
                if (!res.ok || !json.success) {
                    setError(json.error ?? 'Failed to rename board')
                    return false
                }
                return true
            } catch {
                setError('Network error. Please try again.')
                return false
            } finally {
                setIsRenaming(false)
            }
        },
        []
    )

    return { isRenaming, error, renameBoard }
}