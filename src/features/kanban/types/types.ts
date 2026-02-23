export interface User {
  id: string
  name: string
  email: string
  avatar: string | null
}

export interface Label {
  id: string
  name: string
  color: string
  boardId: string
}

export interface Priority {
  id: string
  name: string
  color: string
  order: number
  boardId: string
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
  labels?: Label[]
  priorities?: Priority[]
  members?: { user: User }[]
}

export interface DragItem {
  type: 'ISSUE'
  issueId: string
  sourceColumnId: string
  sourceIndex: number
}