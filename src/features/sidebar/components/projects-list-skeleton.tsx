import { Skeleton } from "@/core/components/ui/skeleton";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/core/components/ui/sidebar";

export function ProjectsListSkeleton() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {Array.from({ length: 3 }).map((_, i) => (
          <SidebarMenuItem key={i}>
            <SidebarMenuButton className="gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 flex-1 rounded" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
