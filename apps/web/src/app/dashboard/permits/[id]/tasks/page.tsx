"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskForm } from "@/components/tasks/TaskForm";
import { WorkflowPicker } from "@/components/tasks/WorkflowPicker";
import { cn } from "@/lib/utils";
import {
  TASK_STATUS,
  TASK_STATUS_LABELS,
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

interface Party {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function PermitTasksPage() {
  const params = useParams();
  const permitId = params.id as string;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showWorkflowPicker, setShowWorkflowPicker] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  useEffect(() => {
    fetchTasks();
    fetchParties();
  }, [permitId]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/permits/${permitId}/tasks`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchParties = async () => {
    try {
      const res = await fetch(`/api/permits/${permitId}/parties`);
      if (res.ok) {
        const data = await res.json();
        setParties(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch parties:", err);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/permits/${permitId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleTaskFormClose = () => {
    setShowTaskForm(false);
    setEditingTask(undefined);
  };

  const handleTaskSaved = () => {
    setShowTaskForm(false);
    setEditingTask(undefined);
    fetchTasks();
  };

  const handleWorkflowApplied = () => {
    setShowWorkflowPicker(false);
    fetchTasks();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      handleStatusChange(taskId, status);
    }
  };

  const filteredTasks = selectedAssignee
    ? tasks.filter((task) => task.assignee?.id === selectedAssignee)
    : tasks;

  const getTasksByStatus = (status: TaskStatus) => {
    return filteredTasks.filter((task) => task.status === status);
  };

  const columns: TaskStatus[] = [
    TASK_STATUS.TODO,
    TASK_STATUS.IN_PROGRESS,
    TASK_STATUS.BLOCKED,
    TASK_STATUS.COMPLETED,
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Tasks</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowWorkflowPicker(true)}
          >
            <Workflow className="h-4 w-4" />
            Apply Workflow
          </Button>
          <Button onClick={() => setShowTaskForm(true)}>
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-3">
        <label
          htmlFor="assignee-filter"
          className="text-sm font-medium text-neutral-700"
        >
          Filter by assignee:
        </label>
        <select
          id="assignee-filter"
          value={selectedAssignee}
          onChange={(e) => setSelectedAssignee(e.target.value)}
          className={cn(
            "flex h-9 rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          )}
        >
          <option value="">All assignees</option>
          {parties.map((party) => (
            <option key={party.userId} value={party.userId}>
              {party.user.name}
            </option>
          ))}
        </select>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((status) => (
            <div
              key={status}
              className="rounded-lg border border-neutral-200 bg-white p-4"
            >
              <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-neutral-100 rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((status) => {
            const columnTasks = getTasksByStatus(status);
            return (
              <div
                key={status}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
                className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-neutral-900">
                    {TASK_STATUS_LABELS[status]}
                  </h3>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-xs font-medium text-neutral-700">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="space-y-3">
                  {columnTasks.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-neutral-400">
                        No tasks
                      </p>
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={handleStatusChange}
                        onClick={handleTaskClick}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          permitId={permitId}
          task={editingTask}
          parties={parties}
          onSaved={handleTaskSaved}
          onClose={handleTaskFormClose}
        />
      )}

      {/* Workflow Picker Modal */}
      {showWorkflowPicker && (
        <WorkflowPicker
          permitId={permitId}
          onApplied={handleWorkflowApplied}
          onClose={() => setShowWorkflowPicker(false)}
        />
      )}
    </div>
  );
}
