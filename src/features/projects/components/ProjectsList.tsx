'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'
import {
    Plus, Loader2, AlertCircle, FolderKanban,
    MoreHorizontal, Users, Trash2, Settings, ChevronRight, FileText
} from 'lucide-react'
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
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
import { CreateBoard } from '@/features/boards/components/CreateBoard'
import { useProjectsWithBoards, type ProjectWithBoards } from '../hooks/useProjectsWithBoards '
import type { Board } from '@/features/boards/hooks/useBoards'
import { BoardsList } from '@/features/boards/components/BoardLists'
import { ProjectSettingsDialog } from '../settings/components/ProjectSettings'

interface ProjectsListProps {
    orgId: string
    userRole?: 'ORG_ADMIN' | 'ORG_MEMBER'
}

type ProjectTarget = { id: string; name: string; userIsLead: boolean } | null
type ProjectMembership = Record<string, { isMember: boolean; role?: 'PROJECT_LEAD' | 'PROJECT_MEMBER' }>

interface ProjectRowProps {
    orgId: string
    project: ProjectWithBoards
    isOpen: boolean
    onToggle: () => void
    canCreateBoard: boolean
    membership: { isMember: boolean; role?: 'PROJECT_LEAD' | 'PROJECT_MEMBER' } | undefined
    isAdmin: boolean
    onMembersClick: () => void
    onSettingsClick: () => void  // ← added
    onDeleteClick: () => void
    onBoardAdded: (board: Board) => void
    onBoardRemoved: (boardId: string) => void
    onBoardRenamed: (boardId: string, newName: string) => void
}

function ProjectRow({
    orgId,
    project,
    isOpen,
    onToggle,
    canCreateBoard,
    membership,
    isAdmin,
    onMembersClick,
    onSettingsClick,  // ← added
    onDeleteClick,
    onBoardAdded,
    onBoardRemoved,
    onBoardRenamed,
}: ProjectRowProps) {
    const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false)
    const projectColor = project.color ?? '#3b82f6'
    const pathname = usePathname()
    
    // Check if current path includes this project
    const isActive = pathname?.includes(`/${project.id}`)

    return (
        <Collapsible open={isOpen} onOpenChange={onToggle}>
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                        asChild
                        className={clsx(
                            "group/item",
                            isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        )}
                    >
                        <div className="flex items-center justify-around w-full cursor-pointer">
                            <div className='flex items-center gap-1.5'>
                                <ChevronRight
                                    className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                                />
                                <span
                                    className="h-2 w-2 rounded-full shrink-0"
                                    style={{ backgroundColor: projectColor }}
                                />
                                <span className="flex-1 truncate text-sm">{project.name}</span>
                            </div>
                            <div
                                className="flex ml-auto items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {canCreateBoard && (
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setIsCreateBoardOpen(true)}
                                        onKeyDown={(e) => e.key === 'Enter' && setIsCreateBoardOpen(true)}
                                        className="flex items-center justify-center h-5 w-5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                        aria-label="Add board"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                    </span>
                                )}

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            className="flex items-center justify-center h-5 w-5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                            aria-label="Project options"
                                        >
                                            <MoreHorizontal className="h-3.5 w-3.5" />
                                        </span>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent side="right" align="start" className="w-48">
                                        {membership?.isMember && (
                                            <DropdownMenuItem
                                                onSelect={onMembersClick}
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
                                                    onSelect={onSettingsClick}  // ← wired up
                                                >
                                                    <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <span>Settings</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                                    onSelect={onDeleteClick}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    <span>Delete project</span>
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <SidebarMenuSub>
                        {/* Docs Link */}
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton 
                                asChild 
                                className={clsx(
                                    pathname?.includes(`/${project.id}/docs`) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                )}
                            >
                                <Link
                                    href={`/app/${orgId}/${project.id}/docs`}
                                    className="flex items-center gap-2"
                                >
                                    <FileText className="h-3.5 w-3.5" />
                                    <span>Docs</span>
                                </Link>
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>

                        <BoardsList
                            orgId={orgId}
                            projectId={project.id}
                            projectColor={projectColor}
                            canCreate={canCreateBoard}
                            onCreateClick={() => setIsCreateBoardOpen(true)}
                            boards={project.boards}
                            isLoading={project.boardsLoading}
                            error={project.boardsError}
                            onBoardRemoved={onBoardRemoved}
                            onBoardRenamed={onBoardRenamed}
                        />
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>

            <CreateBoard
                open={isCreateBoardOpen}
                onOpenChange={setIsCreateBoardOpen}
                orgId={orgId}
                projectId={project.id}
                projectName={project.name}
                onSuccess={(board) => {
                    onBoardAdded(board)
                    setIsCreateBoardOpen(false)
                }}
            />
        </Collapsible>
    )
}

const ProjectsList = ({ orgId, userRole }: ProjectsListProps) => {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<ProjectTarget>(null)
    const [membersTarget, setMembersTarget] = useState<ProjectTarget>(null)
    const [settingsTarget, setSettingsTarget] = useState<ProjectTarget>(null)  // ← added
    const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({})

    const {
        projects,
        isLoading,
        error,
        addProject,
        removeProject,
        refetch,
        addBoard,
        removeBoard,
        renameBoard,
    } = useProjectsWithBoards(orgId)

    const isAdmin = userRole === 'ORG_ADMIN'
    const [projectMemberships, setProjectMemberships] = useState<ProjectMembership>({})

    useEffect(() => {
        const checkProjectMemberships = async () => {
            const memberships: ProjectMembership = {}
            for (const project of projects) {
                try {
                    const res = await fetch(
                        `/api/organizations/${orgId}/projects/${project.id}/members/me`
                    )
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
                        const membership = projectMemberships[project.id]
                        const isProjectLead = membership?.role === 'PROJECT_LEAD'
                        const canCreateBoard = isAdmin || isProjectLead

                        return (
                            <ProjectRow
                                key={project.id}
                                orgId={orgId}
                                project={project}
                                isOpen={openProjects[project.id] ?? false}
                                onToggle={() =>
                                    setOpenProjects((prev) => ({
                                        ...prev,
                                        [project.id]: !prev[project.id],
                                    }))
                                }
                                canCreateBoard={canCreateBoard}
                                membership={membership}
                                isAdmin={isAdmin}
                                onMembersClick={() =>
                                    setMembersTarget({
                                        id: project.id,
                                        name: project.name,
                                        userIsLead: isProjectLead,
                                    })
                                }
                                onSettingsClick={() =>       // ← added
                                    setSettingsTarget({
                                        id: project.id,
                                        name: project.name,
                                        userIsLead: isProjectLead,
                                    })
                                }
                                onDeleteClick={() =>
                                    setDeleteTarget({
                                        id: project.id,
                                        name: project.name,
                                        userIsLead: false,
                                    })
                                }
                                onBoardAdded={(board) => addBoard(project.id, board)}
                                onBoardRemoved={(boardId) => removeBoard(project.id, boardId)}
                                onBoardRenamed={(boardId, newName) => renameBoard(project.id, boardId, newName)}
                            />
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

            <ProjectSettingsDialog
                open={!!settingsTarget}
                onOpenChange={(open) => !open && setSettingsTarget(null)}
                orgId={orgId}
                projectId={settingsTarget?.id ?? ''}
                projectName={settingsTarget?.name ?? ''}
            />

            <ProjectMembersDialog
                open={!!membersTarget}
                onOpenChange={(open) => !open && setMembersTarget(null)}
                orgId={orgId}
                project={membersTarget}
                isAdmin={isAdmin}
                userProjectRole={
                    membersTarget ? projectMemberships[membersTarget.id]?.role : undefined
                }
            />
        </SidebarGroup>
    )
}

export default ProjectsList