import { use } from "react";
import { DocsListView } from "@/features/docs/components/DocsListView";
import { prisma } from "@/core/lib/prisma/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/core/lib/auth/authOptions";

interface PageProps {
  params: Promise<{ tenantId: string; projectId: string }>;
}

export default function DocsPage({ params }: PageProps) {
  const { tenantId, projectId } = use(params);


  // Fetch initial data in Server Component
  const initialData = use(fetchInitialData(projectId));

  if (!initialData) {
    redirect(`/app/${tenantId}`);
  }

  return (
    <DocsListView
      projectId={projectId}
      projectName={initialData.projectName}
      tenantId={tenantId}
      initialDocs={initialData.docs}
    />
  );
}

async function fetchInitialData(projectId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;

  // Verify project membership
  const projectMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });

  if (!projectMember) {
    return null;
  }

  // Fetch project details
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true },
  });

  if (!project) {
    return null;
  }

  // Fetch initial docs
  const docs = await prisma.doc.findMany({
    where: { projectId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Transform to match API response format
  const transformedDocs = docs.map((doc) => ({
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
  }));

  return {
    projectName: project.name,
    docs: transformedDocs,
  };
}
