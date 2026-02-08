"use client";

import {
  Flag,
  ClipboardCheck,
  ArrowRightLeft,
  FileText,
  Camera,
  Activity,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { PERMIT_STATUS_LABELS, type PermitStatus } from "@permits/shared";

interface TimelineEvent {
  id: string;
  type:
    | "milestone"
    | "inspection"
    | "status_change"
    | "document"
    | "photo"
    | "activity";
  title: string;
  description?: string;
  status?: string;
  date: string;
  metadata?: Record<string, unknown>;
}

interface TimelineViewProps {
  events: TimelineEvent[];
}

const typeConfig: Record<
  TimelineEvent["type"],
  { icon: LucideIcon; color: string; bgColor: string }
> = {
  milestone: {
    icon: Flag,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  inspection: {
    icon: ClipboardCheck,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  status_change: {
    icon: ArrowRightLeft,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  document: {
    icon: FileText,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
  },
  photo: {
    icon: Camera,
    color: "text-pink-600",
    bgColor: "bg-pink-100",
  },
  activity: {
    icon: Activity,
    color: "text-neutral-600",
    bgColor: "bg-neutral-100",
  },
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay > 30) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  if (diffHr > 0) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  return "Just now";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function renderStatusDetail(event: TimelineEvent) {
  if (event.type === "milestone") {
    const isCompleted = event.status === "COMPLETED";
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs ${isCompleted ? "text-green-600" : "text-neutral-500"}`}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-3 w-3" />
        ) : (
          <Flag className="h-3 w-3" />
        )}
        {isCompleted ? "Completed" : event.status ?? "Pending"}
      </span>
    );
  }

  if (event.type === "inspection") {
    const result = event.metadata?.result as string | undefined;
    if (result === "PASSED") {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Passed
        </span>
      );
    }
    if (result === "FAILED") {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-red-600">
          <XCircle className="h-3 w-3" />
          Failed
        </span>
      );
    }
    if (event.metadata?.inspectorName) {
      return (
        <span className="text-xs text-neutral-500">
          Inspector: {event.metadata.inspectorName as string}
        </span>
      );
    }
    return null;
  }

  if (event.type === "status_change") {
    const oldStatus = event.metadata?.oldStatus as string | undefined;
    const newStatus = event.metadata?.newStatus as string | undefined;
    if (oldStatus && newStatus) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
          {PERMIT_STATUS_LABELS[oldStatus as PermitStatus] ?? oldStatus}
          <ArrowRightLeft className="h-3 w-3" />
          {PERMIT_STATUS_LABELS[newStatus as PermitStatus] ?? newStatus}
        </span>
      );
    }
    return null;
  }

  if (event.type === "photo" && event.metadata?.fileUrl) {
    return (
      <div className="mt-2">
        <img
          src={event.metadata.fileUrl as string}
          alt={event.title}
          className="h-16 w-16 rounded-lg object-cover border border-neutral-200"
        />
      </div>
    );
  }

  return null;
}

export function TimelineView({ events }: TimelineViewProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Activity className="h-10 w-10 text-neutral-300" />
        <p className="mt-3 text-sm font-medium text-neutral-500">
          No timeline events yet
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          Events will appear here as the permit progresses.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-neutral-200" />

      <div className="space-y-6">
        {events.map((event) => {
          const config = typeConfig[event.type];
          const Icon = config.icon;

          return (
            <div key={event.id} className="relative flex gap-4 pl-0">
              {/* Icon */}
              <div
                className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${config.bgColor}`}
              >
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <p className="text-sm font-medium text-neutral-900">
                  {event.title}
                </p>
                {event.description && (
                  <p className="mt-0.5 text-sm text-neutral-500">
                    {event.description}
                  </p>
                )}
                {renderStatusDetail(event)}
                <div className="mt-1 flex items-center gap-2">
                  <time
                    className="text-xs text-neutral-400"
                    title={formatDate(event.date)}
                  >
                    {formatRelativeTime(event.date)}
                  </time>
                  <span className="text-xs capitalize text-neutral-400">
                    {event.type.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
