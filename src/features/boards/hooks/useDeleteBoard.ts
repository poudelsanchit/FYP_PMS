'use client'

import { useState, useCallback } from 'react'

interface UseDeleteBoardReturn {
    isDeleting: boolean
    error: string | null
    deleteBoard: (orgId: string, projectId: string, boardId: string) => Promise<boolean>
}

export function useDeleteBoard(): UseDeleteBoardReturn {
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const deleteBoard = useCallback(
        async (orgId: string, projectId: string, boardId: string): Promise<boolean> => {
            setIsDeleting(true)
            setError(null)
            try {
                const res = await fetch(
                    `/api/organizations/${orgId}/projects/${projectId}/boards/${boardId}`,
                    { method: 'DELETE' }
                )
                const json = await res.json()
                if (!res.ok || !json.success) {
                    setError(json.error ?? 'Failed to delete board')
                    return false
                }
                return true
            } catch {
                setError('Network error. Please try again.')
                return false
            } finally {
                setIsDeleting(false)
            }
        },
        []
    )

    return { isDeleting, error, deleteBoard }
}