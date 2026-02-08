"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TASK_STATUS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
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
  permitId: string;
  assignee: {
    id: string;
    name: string;
    email: string;
  } | null;
  checklistItems: ChecklistItem[];
  permit: {
    id: string;
    permitNumber: string;
    property: {
      id: string;
      address: string;
    };
  };
}

const statusFilters = [
  { label: "All", value: "" },
  { label: "Todo", value: TASK_STATUS.TODO },
  { label: "In Progress", value: TASK_STATUS.IN_PROGRESS },
  { label: "Blocked", value: TASK_STATUS.BLOCKED },
];

export default function MyTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const url = statusFilter
        ? `/api/tasks?status=${statusFilter}`
        : "/api/tasks";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.data?.tasks || []);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task: Task) => {
    router.push(`/dashboard/permits/${task.permitId}/tasks`);
  };

  const isOverdue = (task: Task) => {
    return (
      task.dueDate &&
      task.status !== TASK_STATUS.COMPLETED &&
      new Date(task.dueDate) < new Date()
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">My Tasks</h1>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.label}
            onClick={() => setStatusFilter(filter.value)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              statusFilter === filter.value
                ? "bg-primary-600 text-white"
                : "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-24 bg-white rounded-lg border border-neutral-200 animate-pulse"
            />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-16 text-center">
          <CheckSquare className="mx-auto h-12 w-12 text-neutral-300" />
          <h3 className="mt-4 text-lg font-medium text-neutral-900">
            No tasks assigned to you
          </h3>
          <p className="mt-2 text-sm text-neutral-500">
            {statusFilter
              ? "No tasks match your current filter."
              : "Tasks assigned to you will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const overdueTask = isOverdue(task);
            const completedItems = task.checklistItems.filter(
              (item) => item.completed
            ).length;
            const totalItems = task.checklistItems.length;
            const progress =
              totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
            const statusColor = TASK_STATUS_COLORS[task.status];
            const priorityColor = TASK_PRIORITY_COLORS[task.priority];

            return (
              <button
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className="w-full text-left p-4 rounded-lg border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-neutral-300"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left side: Task info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 mb-1 line-clamp-1">
                      {task.title}
                    </h3>

                    {/* Context: Permit + Property */}
                    <p className="text-sm text-neutral-600 mb-2">
                      <span className="font-medium">
                        {task.permit.permitNumber}
                      </span>{" "}
                      • {task.permit.property.address}
                    </p>

                    {/* Badges Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Priority Badge */}
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: priorityColor.bg,
                          color: priorityColor.text,
                        }}
                      >
                        {TASK_PRIORITY_LABELS[task.priority]}
                      </span>

                      {/* Status Badge */}
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: statusColor.bg,
                          color: statusColor.text,
                        }}
                      >
                        {TASK_STATUS_LABELS[task.status]}
                      </span>

                      {/* Due Date */}
                      {task.dueDate && (
                        <span
                          className={cn(
                            "text-xs",
                            overdueTask
                              ? "text-red-600 font-medium"
                              : "text-neutral-500"
                          )}
                        >
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}

                      {/* Checklist Progress */}
                      {totalItems > 0 && (
                        <span className="text-xs text-neutral-500">
                          {completedItems}/{totalItems} items (
                          {Math.round(progress)}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side: Progress bar (if has checklist) */}
                  {totalItems > 0 && (
                    <div className="flex-shrink-0 w-24">
                      <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          className="h-full bg-primary-600 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
