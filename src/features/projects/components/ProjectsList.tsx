'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Loader2, AlertCircle, FolderKanban } from 'lucide-react'
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from '@/core/components/ui/sidebar'
import { CreateProject } from './CreateProject'
import { useProjects } from '../hooks/useProjects'

interface ProjectsListProps {
    orgId: string
    userRole?: "ORG_ADMIN" | "ORG_MEMBER"
}

const ProjectsList = ({ orgId, userRole }: ProjectsListProps) => {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const { projects, isLoading, error, addProject, refetch } = useProjects(orgId)
    const isAdmin = userRole === "ORG_ADMIN"

    return (
        <SidebarGroup>
            <div className="flex items-center justify-between group/label">
                <SidebarGroupLabel>Projects</SidebarGroupLabel>

                {isAdmin && (
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="cursor-pointer p-1 hover:bg-accent rounded-md opacity-0 group-hover/label:opacity-100 transition-opacity"
                        aria-label="Add project"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                )}
            </div>

            <SidebarMenu>
                {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="px-2 py-3 flex flex-col items-center gap-1.5 text-center">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <p className="text-xs text-muted-foreground">{error}</p>
                        <button
                            onClick={refetch}
                            className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Try again
                        </button>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="px-2 py-3 text-center">
                        <FolderKanban className="h-4 w-4 text-muted-foreground/50 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">No projects yet</p>
                        {isAdmin && (
                            <button
                                onClick={() => setIsCreateOpen(true)}
                                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors mt-0.5"
                            >
                                Create one
                            </button>
                        )}
                    </div>
                ) : (
                    projects.map((project) => (
                        <SidebarMenuItem key={project.id}>
                            <SidebarMenuButton asChild>
                                <Link
                                    href={`/organizations/${orgId}/projects/${project.id}`}
                                    className="flex items-center gap-2.5"
                                >
                                    <span
                                        className="h-2 w-2 rounded-full shrink-0"
                                        style={{ backgroundColor: project.color }}
                                    />
                                    <span className="truncate">{project.name}</span>
                                    <span className="ml-auto font-mono text-[10px] text-muted-foreground shrink-0 tabular-nums">
                                        {project.key}
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))
                )}
            </SidebarMenu>

            {isAdmin && (
                <CreateProject
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                    orgId={orgId}
                    onSuccess={addProject}
                />
            )}
        </SidebarGroup>
    )
}

export default ProjectsList