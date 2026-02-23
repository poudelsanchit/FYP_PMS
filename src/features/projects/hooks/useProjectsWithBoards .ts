'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Board } from '@/features/boards/hooks/useBoards'
import type { Project } from './useProjects'

export type { Board, Project }

export interface ProjectWithBoards extends Project {
    boards: Board[]
    boardsLoading: boolean
    boardsError: string | null
}

interface UseProjectsWithBoardsReturn {
    projects: ProjectWithBoards[]
    isLoading: boolean
    error: string | null
    addProject: (project: Project) => void
    removeProject: (projectId: string) => void
    refetch: () => void
    addBoard: (projectId: string, board: Board) => void
    removeBoard: (projectId: string, boardId: string) => void
    renameBoard: (projectId: string, boardId: string, newName: string) => void
}

export function useProjectsWithBoards(orgId: string): UseProjectsWithBoardsReturn {
    const [projects, setProjects] = useState<ProjectWithBoards[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchAll = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/organizations/${orgId}/projects`)
            const json = await res.json()

            if (!res.ok || !json.success) {
                setError(json.error ?? 'Failed to load projects')
                return
            }

            const rawProjects: Project[] = json.data.projects

            // Seed projects immediately so the UI shows them while boards load
            setProjects(
                rawProjects.map((p) => ({
                    ...p,
                    boards: [],
                    boardsLoading: true,
                    boardsError: null,
                }))
            )
            setIsLoading(false)

            // Fetch all boards in parallel
            await Promise.all(
                rawProjects.map(async (project) => {
                    try {
                        const bRes = await fetch(
                            `/api/organizations/${orgId}/projects/${project.id}/boards`
                        )
                        const bJson = await bRes.json()

                        setProjects((prev) =>
                            prev.map((p) =>
                                p.id === project.id
                                    ? {
                                        ...p,
                                        boards: bRes.ok && bJson.success ? bJson.data : [],
                                        boardsLoading: false,
                                        boardsError:
                                            bRes.ok && bJson.success
                                                ? null
                                                : (bJson.error ?? 'Failed to load boards'),
                                    }
                                    : p
                            )
                        )
                    } catch {
                        setProjects((prev) =>
                            prev.map((p) =>
                                p.id === project.id
                                    ? { ...p, boardsLoading: false, boardsError: 'Network error' }
                                    : p
                            )
                        )
                    }
                })
            )
        } catch {
            setError('Network error. Please try again.')
            setIsLoading(false)
        }
    }, [orgId])

    useEffect(() => {
        fetchAll()
    }, [fetchAll])

    const addProject = useCallback((project: Project) => {
        setProjects((prev) => [
            { ...project, boards: [], boardsLoading: false, boardsError: null },
            ...prev,
        ])
    }, [])

    const removeProject = useCallback((projectId: string) => {
        setProjects((prev) => prev.filter((p) => p.id !== projectId))
    }, [])

    const addBoard = useCallback((projectId: string, board: Board) => {
        setProjects((prev) =>
            prev.map((p) =>
                p.id === projectId ? { ...p, boards: [...p.boards, board] } : p
            )
        )
    }, [])

    const removeBoard = useCallback((projectId: string, boardId: string) => {
        setProjects((prev) =>
            prev.map((p) =>
                p.id === projectId
                    ? { ...p, boards: p.boards.filter((b) => b.id !== boardId) }
                    : p
            )
        )
    }, [])

    const renameBoard = useCallback((projectId: string, boardId: string, newName: string) => {
        setProjects((prev) =>
            prev.map((p) =>
                p.id === projectId
                    ? {
                        ...p,
                        boards: p.boards.map((b) =>
                            b.id === boardId ? { ...b, name: newName } : b
                        ),
                    }
                    : p
            )
        )
    }, [])

    return {
        projects,
        isLoading,
        error,
        addProject,
        removeProject,
        refetch: fetchAll,
        addBoard,
        removeBoard,
        renameBoard,
    }
}