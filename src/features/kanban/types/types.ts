export interface User {
  id: string
  name: string | null
  email: string
  avatar: string | null
}

export interface Label {
  id: string
  name: string
  color: string
  projectId: string
}

export interface Priority {
  id: string
  name: string
  color: string
  order: number
  projectId: string
}

export interface IssueAssignee {
  issueId: string
  userId: string
  assignedAt: string
  user: User
}

export interface Issue {
  id: string
  title: string
  description: string | null
  columnId: string
  projectId: string
  order: number
  labelId: string | null
  priorityId: string | null
  label: Label | null
  priority: Priority | null
  assignees: IssueAssignee[]
  _count?: { assignees: number }
}

export interface Column {
  id: string
  name: string
  boardId: string
  order: number
  _count?: { issues: number }
}

export interface Board {
  id: string
  name: string
  projectId: string
  organizationId: string
  columns?: Column[]
  project?: {
    id: string
    name: string
  }
}

export interface DragItem {
  type: 'ISSUE'
  issueId: string
  sourceColumnId: string
  sourceIndex: number
}