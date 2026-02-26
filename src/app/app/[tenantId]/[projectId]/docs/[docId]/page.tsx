import { use } from "react";
import { DocEditor } from "@/features/docs/components/DocEditor";
import { prisma } from "@/core/lib/prisma/prisma";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { getDocPermissions } from "@/core/lib/docs/docAuth";
import type { Doc, Permissions } from "@/features/docs/types/doc.types";
import { authOptions } from "@/core/lib/auth/authOptions";

interface PageProps {
  params: Promise<{ tenantId: string; projectId: string; docId: string }>;
}

export default function DocEditorPage({ params }: PageProps) {
  const { tenantId, projectId, docId } = use(params);

  // Fetch doc and permissions in Server Component
  const data = use(fetchDocData(projectId, docId));

  if (!data) {
    notFound();
  }

  return (
    <DocEditor
      projectId={projectId}
      projectName={data.projectName}
      tenantId={tenantId}
      docId={docId}
      initialDoc={data.doc}
      initialPermissions={data.permissions}
    />
  );
}

async function fetchDocData(
  projectId: string,
  docId: string
): Promise<{ doc: Doc; permissions: Permissions; projectName: string } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;

  // Verify project membership and get role
  const projectMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true },
  });

  if (!projectMember) {
    return null;
  }

  // Get org role
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true, name: true },
  });

  if (!project) {
    return null;
  }

  const orgMember = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: project.organizationId } },
    select: { role: true },
  });

  // Fetch the document
  const doc = await prisma.doc.findUnique({
    where: { id: docId, projectId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  if (!doc) {
    return null;
  }

  // Transform to match API response format
  const transformedDoc: Doc = {
    id: doc.id,
    projectId: doc.projectId,
    emoji: doc.emoji,
    title: doc.title,
    content: doc.content,
    status: doc.status.toLowerCase() as "draft" | "published",
    authorId: doc.authorId,
    authorName: doc.author.name ?? "Unknown",
    authorAvatar: doc.author.avatar,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  // Calculate permissions
  const permissions = getDocPermissions(
    userId,
    transformedDoc,
    projectMember.role as "PROJECT_LEAD" | "PROJECT_MEMBER",
    orgMember?.role as "ORG_ADMIN" | "ORG_MEMBER" | null
  );

  return {
    doc: transformedDoc,
    permissions,
    projectName: project.name,
  };
}
