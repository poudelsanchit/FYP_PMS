"use client";

import { InboxPage } from "@/features/inbox/components/InboxPage";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const tenantId = params?.tenantId as string;
  
  return <InboxPage tenantId={tenantId} />;
}
