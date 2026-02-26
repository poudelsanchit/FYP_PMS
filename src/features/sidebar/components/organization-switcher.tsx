"use client";
import * as React from "react";
import { ChevronsUpDown, Plus, Users, Crown, Zap, Building2, Sparkles } from "lucide-react";
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
import { Badge } from "@/core/components/ui/badge";
import Image from "next/image";
import { useUserOrganizations } from "../hooks/useUserOrganizations";
import { Skeleton } from "@/core/components/ui/skeleton";
import { CreateOrganizationDialog } from "./create-organization-dialog";
import { UpgradePlanDialog } from "@/features/billing/components/UpgradePlanDialog";
import { useRouter } from "next/navigation";
import { useToast } from "@/core/components/ui/use-toast";
import axios from "axios";

interface OrganizationSwitcherProps {
  currentOrg: {
    id: string;
    name: string;
    logo?: string;
    plan?: string;
    memberCount?: number;
  };
}

const planIcons = {
  FREE: Zap,
  PREMIUM: Crown,
  ENTERPRISE: Building2,
};

const planColors = {
  FREE: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
  PREMIUM: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  ENTERPRISE: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
};

export function OrganizationSwitcher({ currentOrg }: OrganizationSwitcherProps) {
  const { isMobile } = useSidebar();
  const { organizations, isLoading, refetch } = useUserOrganizations();
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = React.useState(false);
  const [currentPlan, setCurrentPlan] = React.useState<"FREE" | "PREMIUM" | "ENTERPRISE">("FREE");
  const router = useRouter();
  const { toast } = useToast();

  // Fetch current plan
  React.useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await axios.get(`/api/organizations/${currentOrg.id}/billing`);
        setCurrentPlan(res.data.plan || "FREE");
      } catch (error) {
        console.error("Failed to fetch plan:", error);
      }
    };
    fetchPlan();
  }, [currentOrg.id]);

  const handleOrgSwitch = (orgId: string) => {
    const targetOrg = organizations.find(org => org.id === orgId);

    toast({
      title: `Switching to ${targetOrg?.name || 'organization'}...`,
    });

    // Use Next.js router for smooth navigation
    router.push(`/app/${orgId}`);
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

  const PlanIcon = planIcons[currentPlan];

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
                <div className="grid flex-1 gap-0.5 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{currentOrg.name}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0 h-4 font-medium ${planColors[currentPlan]}`}
                    >
                      <PlanIcon className="w-2.5 h-2.5 mr-0.5" />
                      {currentPlan}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      · {currentOrg.memberCount || 1} member{currentOrg.memberCount !== 1 ? "s" : ""}
                    </span>
                  </div>
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
              <DropdownMenuItem
                onClick={() => setShowUpgradeDialog(true)}
                className="gap-2 p-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border border-blue-500/20"
              >
                <div className="flex items-center justify-center size-4 rounded bg-gradient-to-br from-blue-500 to-purple-600">
                  <Sparkles className="size-2.5 text-white" />
                </div>
                <span className="font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Upgrade Plan
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/app/${currentOrg.id}/members`)}
                className="gap-2 p-2"
              >
                <Users className="size-4" />
                <span>Members</span>
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

      <UpgradePlanDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        orgId={currentOrg.id}
        currentPlan={currentPlan}
      />
    </>
  );
}
