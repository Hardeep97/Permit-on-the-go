"use client";

import { cn } from "@/lib/utils";
import {
  TASK_STATUS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
  type TaskStatus,
  type TaskPriority,
} from "@permits/shared";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assignee: {
    id: string;
    name: string;
    email: string;
  } | null;
  checklistItems: ChecklistItem[];
}

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onClick?: (task: Task) => void;
}

export function TaskCard({ task, onStatusChange, onClick }: TaskCardProps) {
  const isOverdue =
    task.dueDate &&
    task.status !== TASK_STATUS.COMPLETED &&
    new Date(task.dueDate) < new Date();

  const completedItems = task.checklistItems.filter((item) => item.completed).length;
  const totalItems = task.checklistItems.length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const priorityColor = TASK_PRIORITY_COLORS[task.priority];

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("taskId", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleClick = () => {
    if (onClick) {
      onClick(task);
    }
  };

  return (
    <div
      draggable={true}
      onDragStart={handleDragStart}
      onClick={handleClick}
      className="group cursor-pointer rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-neutral-300"
    >
      {/* Title */}
      <h3 className="font-semibold text-neutral-900 mb-2 line-clamp-2">
        {task.title}
      </h3>

      {/* Priority Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: priorityColor.bg,
            color: priorityColor.text,
          }}
        >
          {TASK_PRIORITY_LABELS[task.priority]}
        </span>
      </div>

      {/* Assignee */}
      <div className="flex items-center gap-2 mb-3">
        {task.assignee ? (
          <>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
              {task.assignee.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-neutral-600 truncate">
              {task.assignee.name}
            </span>
          </>
        ) : (
          <span className="text-xs text-neutral-400 italic">Unassigned</span>
        )}
      </div>

      {/* Due Date */}
      {task.dueDate && (
        <div
          className={cn(
            "text-xs mb-3",
            isOverdue ? "text-red-600 font-medium" : "text-neutral-500"
          )}
        >
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </div>
      )}

      {/* Checklist Progress */}
      {totalItems > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-600">
            <span>
              {completedItems}/{totalItems} items
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
