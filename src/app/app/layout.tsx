"use client"
import { ReusableSidebarLayout } from "@/features/sidebar/AdminSidebarLayout";
import { headerData, sidebarLinks } from "@/features/sidebar/constants/constants";
import { useParams } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const tenantId = params?.tenantId as string;

    return (
        <ReusableSidebarLayout
            navHeaderData={headerData}
            sidebarLinks={sidebarLinks}
            tenantId={tenantId}>
            {children}
        </ReusableSidebarLayout>
    );
}