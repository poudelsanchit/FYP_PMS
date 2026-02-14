"use client";

import { FolderKanban } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/core/components/ui/dialog";

interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateProject({ open, onOpenChange }: CreateProjectDialogProps) {


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl p-6">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-1">
                            <FolderKanban className="h-5 w-5" />
                        </div>
                        <DialogTitle className="text-lg font-semibold">Create a new project</DialogTitle>
                    </div>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Add a new project to your workspace.
                    </DialogDescription>
                </DialogHeader>


            </DialogContent>
        </Dialog>
    );
}
