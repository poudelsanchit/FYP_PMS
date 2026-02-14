import { LucideIcon } from "lucide-react";
import { ElementType } from "react";

export interface IHeaderData {
  name: string;
  logo: ElementType;
  description: string;
}

export interface ISidebarLinks {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}

export interface IOrganization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

export interface IOrganizationMember {
  id: string;
  role: "ORG_ADMIN" | "ORG_MEMBER";
  organization: IOrganization;
}
