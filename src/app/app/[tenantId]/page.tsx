"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import { ProjectCard } from "@/features/dashboard/components/Projectcard";
import { Skeleton } from "@/core/components/ui/skeleton";
import { CreateProject } from "@/features/projects/components/CreateProject";
import { Button } from "@/core/components/ui/button";
import { Folder, FolderKanban, Kanban, Plus, Check, X } from "lucide-react";

function CardSkeleton() {
    return (
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Skeleton className="w-2.5 h-2.5 rounded-full" />
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-14" />
                    </div>
                </div>
                <Skeleton className="h-7 w-32 rounded-md" />
            </div>
            <Skeleton className="h-[160px] w-full rounded-lg" />
            <Skeleton className="h-1 w-full rounded-full" />
            <div className="flex items-center justify-between pt-1 border-t border-border">
                <div className="flex">
                    {[0, 1, 2].map((i) => (
                        <Skeleton
                            key={i}
                            className="w-6 h-6 rounded-full"
                            style={{ marginLeft: i === 0 ? 0 : "-6px" }}
                        />
                    ))}
                </div>
                <Skeleton className="h-3 w-6" />
            </div>
        </div>
    );
}

export default function OrganizationPage() {
    const params = useParams();
    const router = useRouter();
    const tenantId = params?.tenantId as string;
    const { projects, isLoading, error, refetch } = useDashboard(tenantId);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <div className="p-6 w-full">
            {/* Page header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage your projects and track recent activity
                    </p>
                </div>
                <Button
                    size={'lg'}
                    className="rounded-sm"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <Plus />
                    New Project
                </Button>
            </div>

            {/* Error state */}
            {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 mb-6">
                    {error}
                </div>
            )}

            {/* Project cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                ) : projects.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-24 text-muted-foreground">
                        <FolderKanban />
                        <p className="text-sm font-medium">No projects yet</p>
                        <p className="text-xs mt-1">Create your first project to get started.</p>
                    </div>
                ) : (
                    projects.map((project) => (
                        <ProjectCard key={project.id} project={project} tenantId={tenantId} />
                    ))
                )}
            </div>

            {/* Create Project Modal */}
            <CreateProject
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                orgId={tenantId}
                onSuccess={() => {
                    refetch();
                }}
            />
        </div>
    );
}