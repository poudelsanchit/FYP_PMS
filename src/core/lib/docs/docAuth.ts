// Permission utilities for document operations

import { Doc, Permissions } from "@/features/docs/types/doc.types";

type ProjectRole = "PROJECT_LEAD" | "PROJECT_MEMBER";
type OrgRole = "ORG_ADMIN" | "ORG_MEMBER";

/**
 * Determines if a user can publish a document.
 * Author, PROJECT_LEAD, or ORG_ADMIN can publish.
 */
export function canPublishDoc(
  userId: string,
  doc: Doc,
  projectRole: ProjectRole | null,
  orgRole: OrgRole | null
): boolean {
  // Author can always publish their own docs
  if (doc.authorId === userId) return true;
  
  // PROJECT_LEAD can publish any doc in their project
  if (projectRole === "PROJECT_LEAD") return true;
  
  // ORG_ADMIN can publish any doc in their org
  if (orgRole === "ORG_ADMIN") return true;
  
  return false;
}

/**
 * Determines if a user can delete a document.
 * Author, PROJECT_LEAD, or ORG_ADMIN can delete.
 */
export function canDeleteDoc(
  userId: string,
  doc: Doc,
  projectRole: ProjectRole | null,
  orgRole: OrgRole | null
): boolean {
  // Author can always delete their own docs
  if (doc.authorId === userId) return true;
  
  // PROJECT_LEAD can delete any doc in their project
  if (projectRole === "PROJECT_LEAD") return true;
  
  // ORG_ADMIN can delete any doc in their org
  if (orgRole === "ORG_ADMIN") return true;
  
  return false;
}

/**
 * Gets all permissions for a user on a document.
 * Project members can always edit, but publish/delete require special permissions.
 */
export function getDocPermissions(
  userId: string,
  doc: Doc,
  projectRole: ProjectRole | null,
  orgRole: OrgRole | null
): Permissions {
  // All project members can edit
  const canEdit = projectRole !== null;
  
  return {
    canEdit,
    canPublish: canPublishDoc(userId, doc, projectRole, orgRole),
    canDelete: canDeleteDoc(userId, doc, projectRole, orgRole),
  };
}
