"use client";
import Link from "next/link";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/core/components/ui/breadcrumb";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/core/components/ui/sidebar";
import { Separator } from "@/core/components/ui/separator";
import { useUserData } from "./hooks/useUserData";
import { AppSidebar } from "./components/app-sidebar";
import { IHeaderData, ISidebarLinks } from "./types/types";
import { outfit } from "@/core/fonts/outfit";
import { ThemeToggle } from "@/core/components/theme/theme-toggle";
import { useBreadcrumbStore } from "@/store/breadcrumb-store";

export function ReusableSidebarLayout({ children, sidebarLinks, navHeaderData, tenantId, currentOrg, isLoadingOrg }: { children: React.ReactNode, sidebarLinks: ISidebarLinks, navHeaderData: IHeaderData, tenantId?: string, currentOrg?: { id: string; name: string; logo?: string; plan?: string; memberCount?: number }, isLoadingOrg?: boolean }) {

    const userData = useUserData();
    const segments = useBreadcrumbStore(state => state.segments);

    return (
        <SidebarProvider className={outfit.className}>
            <AppSidebar
                headerData={navHeaderData}
                userData={userData}
                sidebarLinks={sidebarLinks}
                tenantId={tenantId}
                currentOrg={currentOrg}
                isLoadingOrg={isLoadingOrg}
            />
            <SidebarInset className="flex flex-col h-screen overflow-hidden">
                <header className="flex border-b h-12 shrink-0 items-center justify-between gap-2 bg-background z-50">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" variant="secondary" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <Link href="/admin" className="hover:text-foreground">
                                        Home
                                    </Link>
                                </BreadcrumbItem>
                                {segments.map((segment, index) => {
                                    const isLast = index === segments.length - 1;
                                    return (
                                        <div key={`${segment.label}-${index}`} className="flex items-center gap-2">
                                            <BreadcrumbSeparator className="hidden md:block" />
                                            <BreadcrumbItem>
                                                {isLast ? (
                                                    <BreadcrumbLink className="dark:text-white text-black font-medium">
                                                        {segment.label}
                                                    </BreadcrumbLink>
                                                ) : (
                                                    <Link href={segment.href!} className="hover:text-foreground">
                                                        {segment.label}
                                                    </Link>
                                                )}
                                            </BreadcrumbItem>
                                        </div>
                                    );
                                })}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="px-4">
                        <ThemeToggle />
                    </div>
                </header>
                <div className="flex-1 overflow-auto">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}