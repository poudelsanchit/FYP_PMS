"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/core/components/ui/button';
import { CreateOrganizationDialog } from '@/features/sidebar/components/create-organization-dialog';
import { Skeleton } from '@/core/components/ui/skeleton';
import { Separator } from '@/core/components/ui/separator';

const WorkspaceLoadingSkeleton = () => {
    return (
        <div className="flex h-screen w-full">
            {/* Sidebar Skeleton */}
            <div className="w-64 border-r bg-sidebar p-4 space-y-4">
                {/* Organization Header Skeleton */}
                <div className="flex items-center gap-2 px-2 py-1.5">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>

                <Separator />

                {/* Nav Items Skeleton */}
                <div className="space-y-2">
                    <Skeleton className="h-9 w-full rounded-md" />
                    <Skeleton className="h-9 w-full rounded-md" />
                    <Skeleton className="h-9 w-full rounded-md" />
                </div>

                <Separator />

                {/* Projects Skeleton */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-full rounded-md" />
                    <Skeleton className="h-8 w-full rounded-md" />
                    <Skeleton className="h-8 w-full rounded-md" />
                </div>

                {/* Footer Skeleton */}
                <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 px-2 py-1.5">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-1">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex-1 flex flex-col">
                {/* Header Skeleton */}
                <div className="h-12 border-b px-4 flex items-center gap-2">
                    <Skeleton className="h-6 w-6" />
                    <Separator orientation="vertical" className="h-4" />
                    <Skeleton className="h-4 w-32" />
                </div>

                {/* Content Area Skeleton */}
                <div className="flex-1 p-6 space-y-4">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                    
                    <div className="grid grid-cols-3 gap-4 mt-8">
                        <Skeleton className="h-32 rounded-lg" />
                        <Skeleton className="h-32 rounded-lg" />
                        <Skeleton className="h-32 rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const AppRedirectPage = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [error, setError] = useState<string | null>(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [hasRedirected, setHasRedirected] = useState(false);

    useEffect(() => {
        if (hasRedirected) return;

        const redirectToOrganization = async () => {
            if (status === 'loading') return;

            if (!session) {
                router.push('/auth/login');
                return;
            }

            try {
                const response = await fetch('/api/organizations');
                
                if (!response.ok) {
                    throw new Error('Failed to fetch organizations');
                }

                const data = await response.json();

                if (data.organizations && data.organizations.length > 0) {
                    setHasRedirected(true);
                    router.push(`/app/${data.organizations[0].id}`);
                } else {
                    // No organizations found, show create dialog
                    setShowCreateDialog(true);
                }
            } catch (error) {
                console.error('Error fetching organizations:', error);
                setError(error instanceof Error ? error.message : 'Failed to load organizations');
            }
        };

        redirectToOrganization();
    }, [session, status, router, hasRedirected]);

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center max-w-md">
                    <p className="text-destructive mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()}>
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    if (showCreateDialog) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center max-w-md">
                    <h2 className="text-2xl font-semibold mb-2">Welcome!</h2>
                    <p className="text-muted-foreground mb-6">
                        You don't have any organizations yet. Create your first organization to get started.
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                        Create Organization
                    </Button>
                    <CreateOrganizationDialog
                        open={showCreateDialog}
                        onOpenChange={setShowCreateDialog}
                        onSuccess={(orgId) => {
                            setHasRedirected(true);
                            router.push(`/app/${orgId}`);
                        }}
                    />
                </div>
            </div>
        );
    }

    return <WorkspaceLoadingSkeleton />;
};

export default AppRedirectPage;
