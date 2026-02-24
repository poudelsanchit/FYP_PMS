'use client'

import { useState, useCallback } from 'react'

export interface ProjectPriority {
    id: string
    name: string
    color: string
    order: number
    projectId: string
}

export function useProjectPriorities(orgId: string, projectId: string) {
    const [priorities, setPriorities] = useState<ProjectPriority[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const baseUrl = `/api/organizations/${orgId}/projects/${projectId}/priorities`

    const fetch_ = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const res = await fetch(baseUrl)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error ?? 'Failed to load priorities')
            setPriorities(data.data ?? [])
        } catch (e: any) {
            setError(e.message)
        } finally {
            setIsLoading(false)
        }
    }, [baseUrl])

    const add = async (name: string, color: string) => {
        const res = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, color }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to create priority')
        setPriorities((prev) => [...prev, data.data].sort((a, b) => a.order - b.order))
    }

    const update = async (id: string, name: string, color: string) => {
        const res = await fetch(`${baseUrl}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, color }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to update priority')
        setPriorities((prev) =>
            prev.map((p) => (p.id === id ? data.data : p)).sort((a, b) => a.order - b.order)
        )
    }

    const remove = async (id: string) => {
        const res = await fetch(`${baseUrl}/${id}`, { method: 'DELETE' })
        if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error ?? 'Failed to delete priority')
        }
        setPriorities((prev) => prev.filter((p) => p.id !== id))
    }

    return { priorities, isLoading, error, fetch: fetch_, add, update, remove }
}