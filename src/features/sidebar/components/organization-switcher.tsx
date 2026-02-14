"use client";
import * as React from "react";
import { ChevronsUpDown, Plus, Settings, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/core/components/ui/sidebar";
import Image from "next/image";
import { useUserOrganizations } from "../hooks/useUserOrganizations";
import { Skeleton } from "@/core/components/ui/skeleton";
import { CreateOrganizationDialog } from "./create-organization-dialog";
import { useRouter } from "next/navigation";
import { useToast } from "@/core/components/ui/use-toast";

interface OrganizationSwitcherProps {
  currentOrg: {
    id: string;
    name: string;
    logo?: string;
    plan?: string;
    memberCount?: number;
  };
}

export function OrganizationSwitcher({ currentOrg }: OrganizationSwitcherProps) {
  const { isMobile } = useSidebar();
  const { organizations, isLoading, refetch } = useUserOrganizations();
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleOrgSwitch = (orgId: string) => {
    const targetOrg = organizations.find(org => org.id === orgId);
    
    toast({
      title: `Switching to ${targetOrg?.name || 'organization'}...`,
    });
    
    // Use Next.js router for smooth navigation
    router.push(`/app/${orgId}`);
  };

  const handleOrgSettings = () => {
    router.push(`/app/${currentOrg.id}/settings`);
  };

  const handleCreateSuccess = (orgId?: string) => {
    refetch();
    if (orgId) {
      handleOrgSwitch(orgId);
    }
  };

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  {currentOrg.logo ? (
                    <Image
                      src={currentOrg.logo}
                      alt={currentOrg.name}
                      height={32}
                      width={32}
                      className="rounded-lg"
                    />
                  ) : (
                    <span className="text-lg font-semibold">
                      {currentOrg.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{currentOrg.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {currentOrg.plan || "Free Plan"} · {currentOrg.memberCount || 1} member
                    {currentOrg.memberCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {currentOrg.name}
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={handleOrgSettings} className="gap-2 p-2">
                <Settings className="size-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 p-2">
                <Users className="size-4" />
                <span>Invite members</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Switch organization
              </DropdownMenuLabel>
              {organizations
                .filter((org) => org.id !== currentOrg.id)
                .map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => handleOrgSwitch(org.id)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border bg-background">
                      <span className="text-xs font-medium">
                        {org.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span>{org.name}</span>
                  </DropdownMenuItem>
                ))}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => setShowCreateDialog(true)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border border-dashed">
                  <Plus className="size-4" />
                </div>
                <span className="font-medium">New organization</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <CreateOrganizationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
