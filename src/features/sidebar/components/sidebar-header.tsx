"use client";
import * as React from "react";
import {
  SidebarMenu, SidebarMenuButton,
  SidebarMenuItem,
} from "@/core/components/ui/sidebar";
import Image from "next/image";
import useSidebarLogo from "../hooks/useSidebarLogo";
export function SidebarHeaderComponent({
  team,
}: {
  team: {
    name: string;
    logo: React.ElementType;
    description: string;
  };
}) {
  const { logo } = useSidebarLogo()
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg  text-sidebar-primary-foreground">
            <Image src={logo} alt="logo" height={100} width={100} className="w-full h-full " />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium text-foreground">{team.name}</span>
            <span className="truncate text-xs">{team.description}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
