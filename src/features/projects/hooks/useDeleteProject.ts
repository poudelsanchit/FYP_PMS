import { useState } from 'react'

export const useDeleteProject = (orgId: string) => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const deleteProject = async (projectId: string): Promise<boolean> => {
        setIsLoading(true)
        setError(null)

        try {
            const res = await fetch(
                `/api/organizations/${orgId}/projects/${projectId}`,
                { method: 'DELETE' }
            )

            const data = await res.json()

            if (!res.ok) {
                setError(data.error ?? 'Failed to delete project')
                return false
            }

            return true
        } catch {
            setError('Something went wrong')
            return false
        } finally {
            setIsLoading(false)
        }
    }

    return { deleteProject, isLoading, error }
}