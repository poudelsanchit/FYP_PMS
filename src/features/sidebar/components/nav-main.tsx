"use client";

import { type LucideIcon, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { Badge } from "@/core/components/ui/badge";
import { useInboxCount } from "@/features/inbox/hooks/useInboxCount";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/core/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/core/components/ui/collapsible";

interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  items?: NavItem[];
  badge?: number | string;
}

interface NavMainProps {
  items: NavItem[];
  tenantId?: string;
}

// Helper function to check if a nav item is active
function isNavItemActive(pathname: string, itemUrl: string, itemTitle: string): boolean {
  // Special case for Dashboard: treat /app and /app/[tenantId] as the same
  if (itemTitle === "Dashboard") {
    // Match exact /app/[tenantId] or just /app
    const dashboardPattern = /^\/app(\/[^\/]+)?$/;
    return dashboardPattern.test(pathname);
  }

  return pathname === itemUrl;
}

function NavItemRenderer({
  item,
  pathname,
  router,
  isSubItem = false,
}: {
  item: NavItem;
  pathname: string;
  router: ReturnType<typeof useRouter>;
  isSubItem?: boolean;
}) {
  const isActive = isNavItemActive(pathname, item.url, item.title);
  const hasSubItems = item.items && item.items.length > 0;
  const isSubItemActive = hasSubItems && item.items?.some((subItem) => isNavItemActive(pathname, subItem.url, subItem.title));

  if (hasSubItems) {
    // For sub-items with children, return just the button without SidebarMenuItem wrapper
    if (isSubItem) {
      return (
        <Collapsible
          key={item.title}
          asChild
          defaultOpen={true}
          className="group/collapsible"
        >
          <div>
            <CollapsibleTrigger asChild>
              <SidebarMenuSubButton
                className={clsx(
                  "cursor-pointer hover:bg-muted",
                  (isActive || isSubItemActive) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                )}
              >
                <span>{item.title}</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuSubButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.items?.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <NavItemRenderer
                      item={subItem}
                      pathname={pathname}
                      router={router}
                      isSubItem={true}
                    />
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </div>
        </Collapsible>
      );
    }

    // For top-level items with children
    return (
      <Collapsible
        key={item.title}
        asChild
        defaultOpen={true}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={item.title}
              className={clsx(
                "cursor-pointer hover:bg-muted",
                (isActive || isSubItemActive) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              )}
            >
              {item.icon && <item.icon />}
              <span>{item.title}</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items?.map((subItem) => (
                <SidebarMenuSubItem key={subItem.title}>
                  <NavItemRenderer
                    item={subItem}
                    pathname={pathname}
                    router={router}
                    isSubItem={true}
                  />
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return (
    <SidebarMenuSubButton
      asChild
      className={clsx(
        "cursor-pointer hover:bg-muted",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
      )}
    >
      <a onClick={() => router.push(item.url)}>
        <span>{item.title}</span>
      </a>
    </SidebarMenuSubButton>
  );
}

export function NavMain({ items, tenantId }: NavMainProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { count: inboxCount } = useInboxCount(tenantId);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Main</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = isNavItemActive(pathname, item.url, item.title);
          const hasSubItems = item.items && item.items.length > 0;
          const isSubItemActive = hasSubItems && item.items?.some((subItem) => isNavItemActive(pathname, subItem.url, subItem.title));

          // Add inbox count badge
          const badge = item.title === "Inbox" && inboxCount > 0 ? inboxCount : item.badge;

          if (hasSubItems) {
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={true}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className={clsx(
                        "cursor-pointer hover:bg-muted",
                        (isActive || isSubItemActive) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      )}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      {badge && (
                        <Badge
                          variant="default"
                          className="ml-auto h-5 min-w-5 px-1.5 text-xs"
                        >
                          {badge}
                        </Badge>
                      )}
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <NavItemRenderer
                            item={subItem}
                            pathname={pathname}
                            router={router}
                            isSubItem={true}
                          />
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                className={clsx(
                  "cursor-pointer hover:bg-muted ",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                )}
                onClick={() => {
                  router.push(item.url);
                }}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
                {badge && (
                  <Badge
                    variant="default"
                    className="ml-auto h-5 min-w-5 px-1.5 text-xs"
                  >
                    {badge}
                  </Badge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
