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
}

export function AppSidebar({
  headerData,
  userData,
  sidebarLinks,
  tenantId,
  ...props
}: AppSidebarProps) {

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarHeaderComponent team={headerData} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarLinks.items} />
        <div className="px-4">
          <Separator />
        </div>
        <ProjectsListSkeleton />
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
