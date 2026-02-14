"use client"
import { ReusableSidebarLayout } from "@/features/sidebar/AdminSidebarLayout";
import { headerData, sidebarLinks } from "@/features/sidebar/constants/constants";
import { useParams } from "next/navigation";
import { useCurrentOrganization } from "@/features/sidebar/hooks/useCurrentOrganization";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const tenantId = params?.tenantId as string;
    const { organization, isLoading } = useCurrentOrganization(tenantId);

    return (
        <ReusableSidebarLayout
            navHeaderData={headerData}
            sidebarLinks={sidebarLinks}
            tenantId={tenantId}
            currentOrg={organization || undefined}
            isLoadingOrg={isLoading}>
            {children}
        </ReusableSidebarLayout>
    );
}
