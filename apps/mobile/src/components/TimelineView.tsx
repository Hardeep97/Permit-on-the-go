import { View, Text, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface TimelineEvent {
  id: string;
  type: "milestone" | "inspection" | "status_change" | "document" | "photo" | "activity";
  title: string;
  description?: string;
  status?: string;
  date: string;
  metadata?: Record<string, unknown>;
}

interface TimelineViewProps {
  events: TimelineEvent[];
  loading?: boolean;
}

const EVENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  milestone: "flag-outline",
  inspection: "clipboard-outline",
  status_change: "arrow-forward-outline",
  document: "document-outline",
  photo: "camera-outline",
  activity: "time-outline",
};

const EVENT_COLORS: Record<string, string> = {
  milestone: "#8B5CF6",
  inspection: "#F59E0B",
  status_change: "#2563EB",
  document: "#059669",
  photo: "#EC4899",
  activity: "#6B7280",
};

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function TimelineItem({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  const color = EVENT_COLORS[event.type] || "#6B7280";
  const icon = EVENT_ICONS[event.type] || "time-outline";

  return (
    <View className="flex-row" style={{ minHeight: 72 }}>
      {/* Timeline line and dot */}
      <View className="items-center" style={{ width: 40 }}>
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Ionicons name={icon} size={16} color={color} />
        </View>
        {!isLast && (
          <View
            className="flex-1"
            style={{
              width: 2,
              backgroundColor: "#E5E7EB",
              marginTop: 4,
              marginBottom: 4,
            }}
          />
        )}
      </View>

      {/* Event content */}
      <View className="flex-1 ml-3 pb-6">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>
          {event.title}
        </Text>
        {event.description ? (
          <Text className="text-xs text-gray-500 mt-1" numberOfLines={2}>
            {event.description}
          </Text>
        ) : null}
        <View className="flex-row items-center mt-1.5">
          <Ionicons name="time-outline" size={12} color="#9CA3AF" style={{ marginRight: 4 }} />
          <Text className="text-xs text-gray-400">{formatRelativeDate(event.date)}</Text>
          {event.status ? (
            <View
              className="ml-2 rounded-full px-2 py-0.5"
              style={{ backgroundColor: `${color}15` }}
            >
              <Text className="text-[10px] font-medium" style={{ color }}>
                {event.status.replace(/_/g, " ")}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function TimelineView({ events, loading }: TimelineViewProps) {
  if (loading) {
    return (
      <View className="items-center justify-center py-12">
        <Text className="text-sm text-gray-400">Loading timeline...</Text>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View className="items-center justify-center py-12">
        <Ionicons name="time-outline" size={40} color="#D1D5DB" />
        <Text className="text-sm text-gray-400 mt-3">No timeline events yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <TimelineItem event={item} isLast={index === events.length - 1} />
      )}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16 }}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
    />
  );
}
