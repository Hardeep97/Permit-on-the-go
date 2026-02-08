"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  ClipboardCheck,
  AlertTriangle,
  CheckSquare,
  Plus,
  ArrowRight,
  Loader2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/permit/StatusBadge";
import { SubcodeBadge } from "@/components/permit/SubcodeBadge";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  _count?: {
    ownedProperties: number;
    permits: number;
  };
}

interface PermitSummary {
  id: string;
  title: string;
  status: string;
  subcodeType: string;
  createdAt: string;
  property?: {
    name: string;
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-neutral-200" />
          <div className="h-8 w-12 rounded bg-neutral-100" />
        </div>
        <div className="h-12 w-12 rounded-lg bg-neutral-100" />
      </div>
    </div>
  );
}

function PermitRowSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-3 border-b border-neutral-100 px-4 py-3 last:border-b-0">
      <div className="h-9 w-9 rounded-lg bg-neutral-100" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 w-2/3 rounded bg-neutral-200" />
        <div className="h-3 w-1/3 rounded bg-neutral-100" />
      </div>
      <div className="h-6 w-16 rounded-full bg-neutral-100" />
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [permits, setPermits] = useState<PermitSummary[]>([]);
  const [propertyCount, setPropertyCount] = useState(0);
  const [permitCount, setPermitCount] = useState(0);
  const [pendingInspections, setPendingInspections] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [userRes, propertiesRes, permitsRes] = await Promise.all([
          fetch("/api/users/me"),
          fetch("/api/properties?pageSize=1"),
          fetch("/api/permits?pageSize=5"),
        ]);

        if (userRes.ok) {
          const userJson = await userRes.json();
          setUser(userJson.data);
        }

        if (propertiesRes.ok) {
          const propJson = await propertiesRes.json();
          setPropertyCount(propJson.data?.pagination?.total ?? 0);
        }

        if (permitsRes.ok) {
          const permitsJson = await permitsRes.json();
          const allPermits = permitsJson.data?.permits ?? [];
          setPermitCount(permitsJson.data?.pagination?.total ?? 0);
          setPermits(allPermits);

          // Count pending inspections (permits in INSPECTION_SCHEDULED status)
          const pending = allPermits.filter(
            (p: PermitSummary) => p.status === "INSPECTION_SCHEDULED"
          ).length;
          setPendingInspections(pending);
        }
      } catch {
        // Silently handle - stats will show 0
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = [
    {
      label: "Total Properties",
      value: propertyCount.toString(),
      icon: Building2,
      color: "text-primary-600",
      bgColor: "bg-primary-50",
    },
    {
      label: "Active Permits",
      value: permitCount.toString(),
      icon: ClipboardCheck,
      color: "text-success",
      bgColor: "bg-green-50",
    },
    {
      label: "Pending Inspections",
      value: pendingInspections.toString(),
      icon: AlertTriangle,
      color: "text-warning",
      bgColor: "bg-amber-50",
    },
    {
      label: "Tasks Due",
      value: "0",
      icon: CheckSquare,
      color: "text-danger",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {user
            ? `Welcome back, ${user.name}. Here's an overview of your properties and permits.`
            : "Welcome back. Here\u0027s an overview of your properties and permits."}
        </p>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-neutral-900">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}
                  >
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">
          Quick Actions
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/dashboard/properties/new"
            className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
              <Plus className="h-5 w-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-neutral-900">
                Add Property
              </p>
              <p className="text-xs text-neutral-500">
                Register a new property
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-neutral-400" />
          </Link>

          <Link
            href="/dashboard/permits/new"
            className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <ClipboardCheck className="h-5 w-5 text-success" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-neutral-900">
                New Permit
              </p>
              <p className="text-xs text-neutral-500">
                Start a permit application
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-neutral-400" />
          </Link>
        </div>
      </div>

      {/* Recent permits */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            Recent Permits
          </h2>
          {permits.length > 0 && (
            <Link
              href="/dashboard/permits"
              className="text-sm font-medium text-primary-600 hover:underline"
            >
              View all
            </Link>
          )}
        </div>
        <div className="mt-4 rounded-xl border border-neutral-200 bg-white shadow-sm">
          {loading ? (
            <div>
              {Array.from({ length: 3 }).map((_, i) => (
                <PermitRowSkeleton key={i} />
              ))}
            </div>
          ) : permits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ClipboardCheck className="h-12 w-12 text-neutral-300" />
              <p className="mt-4 text-sm font-medium text-neutral-500">
                No recent activity
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                Activity from your properties and permits will appear here.
              </p>
            </div>
          ) : (
            <div>
              {permits.map((permit) => (
                <Link
                  key={permit.id}
                  href={`/dashboard/permits/${permit.id}`}
                  className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 last:border-b-0 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-50">
                    <ClipboardCheck className="h-4 w-4 text-neutral-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {permit.title}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      {permit.property?.name && (
                        <span className="text-xs text-neutral-400">
                          {permit.property.name}
                        </span>
                      )}
                      <span className="text-xs text-neutral-300">|</span>
                      <span className="flex items-center gap-1 text-xs text-neutral-400">
                        <Calendar className="h-3 w-3" />
                        {formatDate(permit.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <SubcodeBadge subcodeType={permit.subcodeType} />
                    <StatusBadge status={permit.status} size="sm" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
