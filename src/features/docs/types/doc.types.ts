// Type definitions for the Project Documentation System

export type DocStatus = 'draft' | 'published';

export interface Doc {
  id: string;
  projectId: string;
  emoji: string;
  title: string;
  content: string; // Tiptap JSON string
  status: DocStatus;
  authorId: string;
  authorName: string | null;
  authorAvatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permissions {
  canEdit: boolean;
  canPublish: boolean;
  canDelete: boolean;
}

// Tiptap document structure types
export interface TiptapDocument {
  type: 'doc';
  content: TiptapNode[];
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, any>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
}

export interface TiptapMark {
  type: string;
  attrs?: Record<string, any>;
}
