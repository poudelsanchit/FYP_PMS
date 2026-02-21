'use client'

import { Loader2, Trash2 } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/core/components/ui/alert-dialog'
import { Button } from '@/core/components/ui/button'
import { useDeleteProject } from '../hooks/useDeleteProject'

interface DeleteProjectProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    orgId: string
    project: { id: string; name: string } | null
    onSuccess: (projectId: string) => void
}

const DeleteProject = ({ open, onOpenChange, orgId, project, onSuccess }: DeleteProjectProps) => {
    const { deleteProject, isLoading, error } = useDeleteProject(orgId)

    const handleDelete = async () => {
        if (!project) return
        const success = await deleteProject(project.id)
        if (success) {
            onSuccess(project.id)
            onOpenChange(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete &quot;{project?.name}&quot;?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the project and all of its data. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {error && (
                    <p className="text-sm text-destructive">{error}</p>
                )}

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4" />
                                Delete project
                            </>
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default DeleteProject