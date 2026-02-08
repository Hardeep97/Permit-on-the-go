import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import api from "@/services/api";

const TASK_STATUS_LABELS: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  COMPLETED: "Completed",
};

const TASK_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  TODO: { bg: "#F3F4F6", text: "#374151" },
  IN_PROGRESS: { bg: "#DBEAFE", text: "#1D4ED8" },
  BLOCKED: { bg: "#FEE2E2", text: "#DC2626" },
  COMPLETED: { bg: "#D1FAE5", text: "#065F46" },
};

const TASK_PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

const TASK_PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  LOW: { bg: "#F3F4F6", text: "#6B7280" },
  NORMAL: { bg: "#DBEAFE", text: "#2563EB" },
  HIGH: { bg: "#FEF3C7", text: "#D97706" },
  URGENT: { bg: "#FEE2E2", text: "#DC2626" },
};

type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED";
type TaskPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  permitId: string;
  permit: {
    id: string;
    title: string;
    property: {
      name: string;
    };
  };
  checklist: { id: string; completed: boolean }[];
}

const FILTER_OPTIONS: { key: string; label: string; status?: TaskStatus }[] = [
  { key: "all", label: "All" },
  { key: "todo", label: "To Do", status: "TODO" },
  { key: "in_progress", label: "In Progress", status: "IN_PROGRESS" },
  { key: "blocked", label: "Blocked", status: "BLOCKED" },
];

export default function MyTasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchTasks = useCallback(async () => {
    try {
      const filter = FILTER_OPTIONS.find((f) => f.key === activeFilter);
      const params = filter?.status ? { status: filter.status } : {};
      const response = await api.get("/tasks", { params });
      setTasks(response.data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      Alert.alert("Error", "Failed to load tasks");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTasks();
  }, [fetchTasks]);

  const isOverdue = (dueDate: string | null, status: TaskStatus) => {
    if (!dueDate || status === "COMPLETED") return false;
    return new Date(dueDate) < new Date();
  };

  const renderTask = ({ item }: { item: Task }) => {
    const statusStyle = TASK_STATUS_COLORS[item.status];
    const priorityStyle = TASK_PRIORITY_COLORS[item.priority];
    const completedChecklist = item.checklist.filter((c) => c.completed).length;
    const totalChecklist = item.checklist.length;
    const progressPercent = totalChecklist > 0 ? (completedChecklist / totalChecklist) * 100 : 0;
    const overdue = isOverdue(item.dueDate, item.status);

    return (
      <TouchableOpacity
        className="mx-4 mb-3 bg-white rounded-xl p-4"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
        onPress={() => router.push(`/permit/${item.permitId}/tasks` as never)}
        activeOpacity={0.7}
      >
        <Text className="text-base font-bold text-gray-900 mb-1">{item.title}</Text>

        {/* Context */}
        <View className="flex-row items-center mb-2">
          <Ionicons name="document-outline" size={12} color="#9CA3AF" style={{ marginRight: 4 }} />
          <Text className="text-xs text-gray-500 flex-1" numberOfLines={1}>
            {item.permit.title} • {item.permit.property.name}
          </Text>
        </View>

        {/* Badges row */}
        <View className="flex-row flex-wrap items-center gap-2 mb-2">
          {/* Priority */}
          <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: priorityStyle.bg }}>
            <Text className="text-[10px] font-semibold" style={{ color: priorityStyle.text }}>
              {TASK_PRIORITY_LABELS[item.priority]}
            </Text>
          </View>

          {/* Status */}
          <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: statusStyle.bg }}>
            <Text className="text-[10px] font-semibold" style={{ color: statusStyle.text }}>
              {TASK_STATUS_LABELS[item.status]}
            </Text>
          </View>

          {/* Due date */}
          {item.dueDate && (
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={12} color={overdue ? "#DC2626" : "#9CA3AF"} style={{ marginRight: 3 }} />
              <Text className={`text-xs ${overdue ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                {new Date(item.dueDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Checklist progress */}
        {totalChecklist > 0 && (
          <View>
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xs text-gray-500">
                Checklist: {completedChecklist}/{totalChecklist}
              </Text>
              <Text className="text-xs font-semibold text-gray-600">{Math.round(progressPercent)}%</Text>
            </View>
            <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-brand-600 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={["top"]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-sm text-gray-400 mt-3">Loading tasks...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <Text className="text-lg font-bold text-gray-900">My Tasks</Text>
      </View>

      {/* Filter chips */}
      <View className="bg-white border-b border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
        >
          {FILTER_OPTIONS.map((filter) => {
            const isActive = activeFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                className={`rounded-full px-4 py-2 ${
                  isActive ? "bg-brand-600" : "bg-gray-100"
                }`}
                onPress={() => setActiveFilter(filter.key)}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-sm font-semibold ${
                    isActive ? "text-white" : "text-gray-600"
                  }`}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Task list */}
      {tasks.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="checkbox-outline" size={64} color="#D1D5DB" />
          <Text className="text-base text-gray-400 mt-4 text-center">No tasks assigned to you</Text>
          <Text className="text-sm text-gray-400 mt-1 text-center">
            Tasks assigned to you will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
          }
        />
      )}
    </SafeAreaView>
  );
}
