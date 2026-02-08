"use client";

import {
  SUBCODE_LABELS,
  SUBCODE_ICONS,
  type SubcodeType,
} from "@permits/shared";
import {
  Building,
  Droplet,
  Zap,
  Flame,
  Map,
  Settings,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  building: Building,
  droplet: Droplet,
  zap: Zap,
  flame: Flame,
  map: Map,
  settings: Settings,
};

const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
  BUILDING: { bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-500" },
  PLUMBING: { bg: "bg-cyan-50", text: "text-cyan-700", icon: "text-cyan-500" },
  ELECTRICAL: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: "text-amber-500",
  },
  FIRE: { bg: "bg-red-50", text: "text-red-700", icon: "text-red-500" },
  ZONING: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: "text-emerald-500",
  },
  MECHANICAL: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    icon: "text-purple-500",
  },
};

interface SubcodeBadgeProps {
  subcodeType: string;
}

export function SubcodeBadge({ subcodeType }: SubcodeBadgeProps) {
  const label =
    SUBCODE_LABELS[subcodeType as SubcodeType] ??
    subcodeType.replace(/_/g, " ");
  const iconKey = SUBCODE_ICONS[subcodeType as SubcodeType] ?? "settings";
  const Icon = iconMap[iconKey] ?? Settings;
  const colors = colorMap[subcodeType] ?? {
    bg: "bg-neutral-50",
    text: "text-neutral-700",
    icon: "text-neutral-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      <Icon className={`h-3 w-3 ${colors.icon}`} />
      {label}
    </span>
  );
}
