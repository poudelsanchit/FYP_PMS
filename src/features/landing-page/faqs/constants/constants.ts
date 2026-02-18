import { FAQItem } from "../types/types";

export const faqItems: FAQItem[] = [
  {
    id: "item-1",
    icon: "rocket",
    question: "What is Rebase and how does it work?",
    answer:
      "Rebase is a simple yet powerful task management tool that helps individuals and teams organize their work. It offers task boards with drag-and-drop functionality, priority labeling, team collaboration, and basic file attachments to keep your work streamlined.",
  },
  {
    id: "item-2",
    icon: "users",
    question: "How do I add members to my workspace?",
    answer:
      "You can invite members by clicking 'Invite' in your workspace settings. Enter their email addresses and choose their permission level (admin, editor, or viewer). They'll receive an email invitation to join.",
  },
  {
    id: "item-3",
    icon: "tag",
    question: "How do labels and priorities work?",
    answer:
      "You can create custom labels to categorize tasks (like 'bug', 'feature', 'urgent'). Priorities (Low, Medium, High) help sort tasks. Both can be used to filter your board view.",
  },
  {
    id: "item-4",
    icon: "image",
    question: "What file types can I attach to tasks?",
    answer:
      "You can attach images (JPG, PNG, GIF), documents (PDF) up to 5MB per file.",
  },
  {
    id: "item-5",
    icon: "move",
    question: "How does drag-and-drop work?",
    answer:
      "Simply click and hold any task card, then drag it to another column or position in your board. Release to drop. This works for both individual tasks and multiple selections.",
  },
  {
    id: "item-6",
    icon: "filter",
    question: "Can I filter tasks by member or label?",
    answer:
      "Yes! Use the filter bar above your board to view tasks by assignee, label, priority, or due date. Multiple filters can be combined for precise views.",
  },
];
