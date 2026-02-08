import { View, Text } from "react-native";

type PermitStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "approved"
  | "active"
  | "completed"
  | "rejected"
  | "expired"
  | "cancelled";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bgColor: string; textColor: string }
> = {
  draft: {
    label: "Draft",
    bgColor: "#F3F4F6",
    textColor: "#6B7280",
  },
  submitted: {
    label: "Submitted",
    bgColor: "#EFF6FF",
    textColor: "#2563EB",
  },
  in_review: {
    label: "In Review",
    bgColor: "#FEF3C7",
    textColor: "#D97706",
  },
  approved: {
    label: "Approved",
    bgColor: "#ECFDF5",
    textColor: "#059669",
  },
  active: {
    label: "Active",
    bgColor: "#ECFDF5",
    textColor: "#059669",
  },
  completed: {
    label: "Completed",
    bgColor: "#EFF6FF",
    textColor: "#2563EB",
  },
  rejected: {
    label: "Rejected",
    bgColor: "#FEF2F2",
    textColor: "#DC2626",
  },
  expired: {
    label: "Expired",
    bgColor: "#FEF2F2",
    textColor: "#DC2626",
  },
  cancelled: {
    label: "Cancelled",
    bgColor: "#F3F4F6",
    textColor: "#6B7280",
  },
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " "),
    bgColor: "#F3F4F6",
    textColor: "#6B7280",
  };

  const paddingClass = size === "sm" ? "px-2 py-0.5" : "px-3 py-1";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <View
      className={`rounded-full ${paddingClass}`}
      style={{ backgroundColor: config.bgColor }}
    >
      <Text
        className={`${textSize} font-semibold`}
        style={{ color: config.textColor }}
      >
        {config.label}
      </Text>
    </View>
  );
}
