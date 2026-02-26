"use client";

import { Button } from "@/core/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface DocsHeaderProps {
  projectName: string;
  projectId: string;
  tenantId: string;
  onCreateDoc: () => Promise<string | null>;
}

export function DocsHeader({
  projectName,
  projectId,
  tenantId,
  onCreateDoc,
}: DocsHeaderProps) {
  const router = useRouter();

  const handleCreateDoc = async () => {
    const docId = await onCreateDoc();
    if (docId) {
      router.push(`/app/${tenantId}/${projectId}/docs/${docId}`);
    }
  };

  return (
    <Button onClick={handleCreateDoc} className="gap-2 shrink-0">
      <Plus className="w-4 h-4" />
      New Doc
    </Button>
  );
}
