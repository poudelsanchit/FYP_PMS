// Updated AppSidebar component
"use client";
import DefaultImage from "@/../public/default.jpg";
import {
  Sidebar, SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/core/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { SidebarFooterComponent } from "./sidebar-footer";
import { IHeaderData, ISidebarLinks } from "../types/types";
import { ProjectsListSkeleton } from "./projects-list-skeleton";
import { Separator } from "@/core/components/ui/separator";
import { SidebarHeaderComponent } from "./sidebar-header";
import { OrganizationSwitcher } from "./organization-switcher";
import { OrganizationHeaderSkeleton } from "./organization-header-skeleton";
import ProjectsList from "@/features/projects/components/ProjectsList";


interface IUserData {
  name?: string;
  email: string;
  id?: string;
  userId?: string;
  isVerified?: boolean;
  role?: string;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  headerData: IHeaderData;
  userData: IUserData;
  sidebarLinks: ISidebarLinks;
  tenantId?: string;
  currentOrg?: {
    id: string;
    name: string;
    logo?: string;
    plan?: string;
    memberCount?: number;
    role?: "ORG_ADMIN" | "ORG_MEMBER";
  };
  isLoadingOrg?: boolean;
}

export function AppSidebar({
  headerData,
  userData,
  sidebarLinks,
  tenantId,
  currentOrg,
  isLoadingOrg,
  ...props
}: AppSidebarProps) {
  // Prepend tenantId to all sidebar link URLs
  const sidebarLinksWithTenant = tenantId
    ? {
      ...sidebarLinks,
      items: sidebarLinks.items.map((item) => ({
        ...item,
        url: `/app/${tenantId}${item.url}`,
      })),
    }
    : sidebarLinks;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {isLoadingOrg ? (
          <OrganizationHeaderSkeleton />
        ) : currentOrg ? (
          <OrganizationSwitcher key={currentOrg.id} currentOrg={currentOrg} />
        ) : (
          <SidebarHeaderComponent team={headerData} />
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarLinksWithTenant.items} />
        <div className="px-4">
          <Separator />
        </div>
        {!tenantId && <ProjectsListSkeleton />}
        {
          tenantId && <ProjectsList orgId={tenantId} userRole={currentOrg?.role} />
        }
      </SidebarContent>


      <SidebarFooter>
        <SidebarFooterComponent
          user={{
            name: userData.name || "Anonymous User",
            email: userData.email,
            avatar: DefaultImage.src, // fallback avatar
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
