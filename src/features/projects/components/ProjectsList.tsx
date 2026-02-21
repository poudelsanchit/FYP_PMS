'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Plus, Loader2, AlertCircle, FolderKanban,
    MoreHorizontal, Users, Trash2, Settings, ChevronRight
} from 'lucide-react'
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuAction,
    SidebarMenuSub,
} from '@/core/components/ui/sidebar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/core/components/ui/collapsible'
import { CreateProject } from './CreateProject'
import DeleteProject from './DeleteProject'
import ProjectMembersDialog from './ProjectMembersDialog'
import { useProjects } from '../hooks/useProjects'

interface ProjectsListProps {
    orgId: string
    userRole?: 'ORG_ADMIN' | 'ORG_MEMBER'
}

type ProjectTarget = { id: string; name: string; userIsLead: boolean } | null
type ProjectMembership = Record<string, { isMember: boolean; role?: 'PROJECT_LEAD' | 'PROJECT_MEMBER' }>

const ProjectsList = ({ orgId, userRole }: ProjectsListProps) => {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<ProjectTarget>(null)
    const [membersTarget, setMembersTarget] = useState<ProjectTarget>(null)
    const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({})
    const { projects, isLoading, error, addProject, removeProject, refetch } = useProjects(orgId)
    const isAdmin = userRole === 'ORG_ADMIN'

    const [projectMemberships, setProjectMemberships] = useState<ProjectMembership>({})
    useEffect(() => {
        const checkProjectMemberships = async () => {
            const memberships: Record<string, { isMember: boolean; role?: 'PROJECT_LEAD' | 'PROJECT_MEMBER' }> = {}
            for (const project of projects) {
                try {
                    const res = await fetch(`/api/organizations/${orgId}/projects/${project.id}/members/me`)
                    if (res.ok) {
                        const data = await res.json()
                        memberships[project.id] = {
                            isMember: data.data?.isMember ?? false,
                            role: data.data?.role,
                        }
                    }
                } catch (err) {
                    console.error(`Failed to check membership for project ${project.id}:`, err)
                }
            }
            setProjectMemberships(memberships)
        }
        if (projects.length > 0) checkProjectMemberships()
    }, [projects, orgId])

    const toggleProject = (projectId: string) => {
        setOpenProjects((prev) => ({ ...prev, [projectId]: !prev[projectId] }))
    }

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
                    projects.map((project) => {
                        const isOpen = openProjects[project.id] ?? false

                        return (
                            <Collapsible
                                key={project.id}
                                open={isOpen}
                                onOpenChange={() => toggleProject(project.id)}
                            >
                                <SidebarMenuItem>
                                    <div className="flex items-center w-full group/item">
                                        {/* Chevron toggle */}
                                        <CollapsibleTrigger asChild>

                                            {/* Main link */}
                                            <SidebarMenuButton asChild className="flex-1 min-w-0 pl-0">
                                                <div
                                                    className="flex items-center cursor-pointer"
                                                >
                                                    <button className="pl-1 shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                                                        <ChevronRight
                                                            className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                                                        />
                                                    </button>

                                                    <span
                                                        className="h-2 w-2 rounded-full shrink-0"
                                                        style={{ backgroundColor: project.color }}
                                                    />
                                                    <span className="truncate">{project.name}</span>
                                                    {/* <span className="ml-auto font-mono text-[10px] text-muted-foreground shrink-0 tabular-nums">
                                                        {project.key}
                                                    </span> */}
                                                </div>
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>

                                        {/* More actions */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <SidebarMenuAction showOnHover>
                                                    <MoreHorizontal className="h-4 w-4 cursor-pointer" />
                                                    <span className="sr-only">Project options</span>
                                                </SidebarMenuAction>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent side="right" align="start" className="w-48">
                                                {projectMemberships[project.id]?.isMember && (
                                                    <DropdownMenuItem
                                                        onSelect={() => setMembersTarget({
                                                            id: project.id,
                                                            name: project.name,
                                                            userIsLead: projectMemberships[project.id]?.role === 'PROJECT_LEAD',
                                                        })}
                                                        className="gap-2 cursor-pointer"
                                                    >
                                                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span>Members</span>
                                                    </DropdownMenuItem>
                                                )}
                                                {isAdmin && (
                                                    <>
                                                        <DropdownMenuItem
                                                            className="gap-2 cursor-pointer"
                                                            onSelect={() => { /* settings handler */ }}
                                                        >
                                                            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                                                            <span>Settings</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                                            onSelect={() => setDeleteTarget({
                                                                id: project.id,
                                                                name: project.name,
                                                                userIsLead: false,
                                                            })}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            <span>Delete project</span>
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Collapsible content — boards will go here later */}
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            <p className="px-2 py-1.5 text-[11px] text-muted-foreground/50 italic">
                                                No boards yet
                                            </p>
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        )
                    })
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

            <DeleteProject
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                orgId={orgId}
                project={deleteTarget}
                onSuccess={removeProject}
            />

            <ProjectMembersDialog
                open={!!membersTarget}
                onOpenChange={(open) => !open && setMembersTarget(null)}
                orgId={orgId}
                project={membersTarget}
                isAdmin={isAdmin}
                userProjectRole={membersTarget ? projectMemberships[membersTarget.id]?.role : undefined}
            />
        </SidebarGroup>
    )
}

export default ProjectsList