import { Building, Inbox, LayoutDashboard, Video } from "lucide-react";

export const headerData = {
  name: "Rebase",
  logo: Building,
  description: "Project Management System",
};

export const sidebarLinks = {
  items: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Inbox",
      url: "/inbox",
      icon: Inbox,
    },
    {
      title: "Meetings",
      url: "/meetings",
      icon: Video,
    },
  ],
};
