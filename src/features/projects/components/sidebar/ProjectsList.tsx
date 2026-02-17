'use client'
import { SidebarGroup, SidebarGroupLabel } from '@/core/components/ui/sidebar'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { CreateProject } from '../CreateProject'

const ProjectsList = () => {
    const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);

    return (
        <SidebarGroup>
            <div className="flex items-center justify-between group/label">
                <SidebarGroupLabel>Projects</SidebarGroupLabel>

                <button
                    onClick={() => setIsCreateProjectDialogOpen(true)}
                    className="cursor-pointer   p-1 hover:bg-accent rounded-md"
                    aria-label="Add project"
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>

            <CreateProject onOpenChange={setIsCreateProjectDialogOpen} open={isCreateProjectDialogOpen} />
        </SidebarGroup>
    )
}

export default ProjectsList