export const TASK_STATUS = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  BLOCKED: "BLOCKED",
  COMPLETED: "COMPLETED",
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  COMPLETED: "Completed",
};

export const TASK_STATUS_COLORS: Record<
  TaskStatus,
  { bg: string; text: string }
> = {
  TODO: { bg: "#F3F4F6", text: "#374151" },
  IN_PROGRESS: { bg: "#DBEAFE", text: "#1D4ED8" },
  BLOCKED: { bg: "#FEE2E2", text: "#DC2626" },
  COMPLETED: { bg: "#D1FAE5", text: "#065F46" },
};

export const TASK_PRIORITY = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export type TaskPriority = (typeof TASK_PRIORITY)[keyof typeof TASK_PRIORITY];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

export const TASK_PRIORITY_COLORS: Record<
  TaskPriority,
  { bg: string; text: string }
> = {
  LOW: { bg: "#F3F4F6", text: "#6B7280" },
  NORMAL: { bg: "#DBEAFE", text: "#2563EB" },
  HIGH: { bg: "#FEF3C7", text: "#D97706" },
  URGENT: { bg: "#FEE2E2", text: "#DC2626" },
};
