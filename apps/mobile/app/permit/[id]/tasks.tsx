import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeId: string | null;
  assignee: { id: string; name: string } | null;
  checklist: ChecklistItem[];
}

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

interface Party {
  id: string;
  name: string;
  role: string;
}

interface Workflow {
  id: string;
  name: string;
  steps: { title: string; description: string | null }[];
}

export default function PermitTasksScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Set<TaskStatus>>(new Set());

  // Add Task Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("NORMAL");
  const [newAssigneeId, setNewAssigneeId] = useState<string | null>(null);
  const [newDueDate, setNewDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Apply Workflow Modal
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);
  const [applyingWorkflow, setApplyingWorkflow] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await api.get(`/permits/${id}/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      Alert.alert("Error", "Failed to load tasks");
    }
  }, [id]);

  const fetchParties = useCallback(async () => {
    try {
      const response = await api.get(`/permits/${id}/parties`);
      const partiesData = response.data?.parties ?? response.data ?? [];
      setParties(Array.isArray(partiesData) ? partiesData : []);
    } catch (error) {
      console.error("Failed to fetch parties:", error);
    }
  }, [id]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchTasks(), fetchParties()]);
    setLoading(false);
    setRefreshing(false);
  }, [fetchTasks, fetchParties]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, [fetchAll]);

  const toggleTaskExpand = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const toggleSection = (status: TaskStatus) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const toggleChecklistItem = async (taskId: string, itemId: string, completed: boolean) => {
    try {
      await api.patch(`/permits/${id}/tasks/${taskId}/checklist/${itemId}`, { completed });
      // Optimistic update
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                checklist: task.checklist.map((item) =>
                  item.id === itemId ? { ...item, completed } : item
                ),
              }
            : task
        )
      );
    } catch (error) {
      console.error("Failed to toggle checklist item:", error);
      Alert.alert("Error", "Failed to update checklist item");
    }
  };

  const handleAddTask = async () => {
    if (!newTitle.trim()) {
      Alert.alert("Required", "Please enter a task title.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/permits/${id}/tasks`, {
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        priority: newPriority,
        assigneeId: newAssigneeId,
        dueDate: newDueDate || null,
      });
      setNewTitle("");
      setNewDescription("");
      setNewPriority("NORMAL");
      setNewAssigneeId(null);
      setNewDueDate("");
      setShowAddModal(false);
      fetchTasks();
      Alert.alert("Success", "Task created successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.error || "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShowWorkflows = async () => {
    setShowWorkflowModal(true);
    setLoadingWorkflows(true);
    try {
      const response = await api.get("/workflows");
      setWorkflows(response.data);
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
      Alert.alert("Error", "Failed to load workflows");
    } finally {
      setLoadingWorkflows(false);
    }
  };

  const handleApplyWorkflow = async () => {
    if (!selectedWorkflow) return;

    setApplyingWorkflow(true);
    try {
      await api.post(`/permits/${id}/apply-workflow`, { workflowId: selectedWorkflow.id });
      setShowWorkflowModal(false);
      setSelectedWorkflow(null);
      fetchTasks();
      Alert.alert("Success", "Workflow applied successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.error || "Failed to apply workflow");
    } finally {
      setApplyingWorkflow(false);
    }
  };

  const isOverdue = (dueDate: string | null, status: TaskStatus) => {
    if (!dueDate || status === "COMPLETED") return false;
    return new Date(dueDate) < new Date();
  };

  const groupedTasks: Record<TaskStatus, Task[]> = {
    TODO: tasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
    BLOCKED: tasks.filter((t) => t.status === "BLOCKED"),
    COMPLETED: tasks.filter((t) => t.status === "COMPLETED"),
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
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 flex-1">Tasks</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} className="p-1">
          <Ionicons name="add-circle" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        {tasks.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="checkbox-outline" size={48} color="#D1D5DB" />
            <Text className="text-sm text-gray-400 mt-3">No tasks yet</Text>
            <TouchableOpacity
              className="mt-4 bg-brand-600 rounded-xl px-5 py-2.5"
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.8}
            >
              <Text className="text-white text-sm font-semibold">Add Task</Text>
            </TouchableOpacity>
          </View>
        ) : (
          (["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED"] as TaskStatus[]).map((status) => {
            const statusTasks = groupedTasks[status];
            const isCollapsed = collapsedSections.has(status);
            const statusStyle = TASK_STATUS_COLORS[status];

            return (
              <View key={status} className="mt-4">
                {/* Section Header */}
                <TouchableOpacity
                  className="flex-row items-center px-4 py-2"
                  onPress={() => toggleSection(status)}
                  activeOpacity={0.7}
                >
                  <View
                    className="rounded-full px-3 py-1 flex-row items-center"
                    style={{ backgroundColor: statusStyle.bg }}
                  >
                    <Text className="text-sm font-bold mr-1.5" style={{ color: statusStyle.text }}>
                      {TASK_STATUS_LABELS[status]}
                    </Text>
                    <View
                      className="rounded-full px-1.5 min-w-[20px] items-center"
                      style={{ backgroundColor: statusStyle.text }}
                    >
                      <Text className="text-[10px] font-bold" style={{ color: statusStyle.bg }}>
                        {statusTasks.length}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={isCollapsed ? "chevron-down" : "chevron-up"}
                    size={20}
                    color="#9CA3AF"
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>

                {/* Tasks */}
                {!isCollapsed &&
                  statusTasks.map((task) => {
                    const isExpanded = expandedTasks.has(task.id);
                    const priorityStyle = TASK_PRIORITY_COLORS[task.priority];
                    const completedChecklist = task.checklist.filter((c) => c.completed).length;
                    const totalChecklist = task.checklist.length;
                    const progressPercent = totalChecklist > 0 ? (completedChecklist / totalChecklist) * 100 : 0;
                    const overdue = isOverdue(task.dueDate, task.status);

                    return (
                      <View
                        key={task.id}
                        className="mx-4 mb-2 bg-white rounded-xl p-3"
                        style={{
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 4,
                          elevation: 2,
                        }}
                      >
                        <TouchableOpacity onPress={() => toggleTaskExpand(task.id)} activeOpacity={0.7}>
                          <View className="flex-row items-start">
                            <View className="flex-1 mr-2">
                              <Text className="text-sm font-bold text-gray-900">{task.title}</Text>
                              <View className="flex-row flex-wrap items-center mt-2 gap-2">
                                {/* Priority badge */}
                                <View
                                  className="rounded-full px-2 py-0.5"
                                  style={{ backgroundColor: priorityStyle.bg }}
                                >
                                  <Text className="text-[10px] font-semibold" style={{ color: priorityStyle.text }}>
                                    {TASK_PRIORITY_LABELS[task.priority]}
                                  </Text>
                                </View>

                                {/* Assignee */}
                                <View className="flex-row items-center">
                                  <Ionicons name="person-outline" size={12} color="#9CA3AF" style={{ marginRight: 3 }} />
                                  <Text className="text-xs text-gray-500">
                                    {task.assignee?.name || "Unassigned"}
                                  </Text>
                                </View>

                                {/* Due date */}
                                {task.dueDate && (
                                  <View className="flex-row items-center">
                                    <Ionicons name="calendar-outline" size={12} color={overdue ? "#DC2626" : "#9CA3AF"} style={{ marginRight: 3 }} />
                                    <Text className={`text-xs ${overdue ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                                      {new Date(task.dueDate).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </Text>
                                  </View>
                                )}
                              </View>

                              {/* Checklist progress */}
                              {totalChecklist > 0 && (
                                <View className="mt-2">
                                  <Text className="text-xs text-gray-500 mb-1">
                                    {completedChecklist}/{totalChecklist}
                                  </Text>
                                  <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <View
                                      className="h-full bg-brand-600 rounded-full"
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </View>
                                </View>
                              )}
                            </View>
                            <Ionicons
                              name={isExpanded ? "chevron-up" : "chevron-down"}
                              size={20}
                              color="#9CA3AF"
                            />
                          </View>
                        </TouchableOpacity>

                        {/* Expanded content */}
                        {isExpanded && (
                          <View className="mt-3 pt-3 border-t border-gray-100">
                            {task.description && (
                              <Text className="text-sm text-gray-600 mb-3">{task.description}</Text>
                            )}

                            {/* Checklist */}
                            {task.checklist.length > 0 && (
                              <View className="mt-2">
                                <Text className="text-xs font-semibold text-gray-700 mb-2">Checklist</Text>
                                {task.checklist
                                  .sort((a, b) => a.order - b.order)
                                  .map((item) => (
                                    <TouchableOpacity
                                      key={item.id}
                                      className="flex-row items-center py-1.5"
                                      onPress={() => toggleChecklistItem(task.id, item.id, !item.completed)}
                                      activeOpacity={0.7}
                                    >
                                      <View
                                        className={`w-5 h-5 rounded border-2 items-center justify-center mr-2 ${
                                          item.completed ? "bg-brand-600 border-brand-600" : "border-gray-300"
                                        }`}
                                      >
                                        {item.completed && (
                                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                        )}
                                      </View>
                                      <Text
                                        className={`flex-1 text-sm ${
                                          item.completed ? "text-gray-400 line-through" : "text-gray-700"
                                        }`}
                                      >
                                        {item.title}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
              </View>
            );
          })
        )}

        {/* FAB Area */}
        <View className="px-4 pt-4 pb-8">
          <TouchableOpacity
            className="bg-brand-600 rounded-xl py-3 flex-row items-center justify-center mb-2"
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text className="text-white text-sm font-semibold">Add Task</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-purple-600 rounded-xl py-3 flex-row items-center justify-center"
            onPress={handleShowWorkflows}
            activeOpacity={0.8}
          >
            <Ionicons name="git-branch-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text className="text-white text-sm font-semibold">Apply Workflow</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Task Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
          <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
            <TouchableOpacity onPress={() => setShowAddModal(false)} className="mr-3">
              <Text className="text-base text-brand-600 font-medium">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900 flex-1 text-center">Add Task</Text>
            <TouchableOpacity onPress={handleAddTask} disabled={submitting}>
              <Text className={`text-base font-semibold ${submitting ? "text-gray-400" : "text-brand-600"}`}>
                {submitting ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-4 pt-4">
            <Text className="text-xs text-gray-500 mb-2">Title *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 mb-4"
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Task title"
              placeholderTextColor="#9CA3AF"
            />

            <Text className="text-xs text-gray-500 mb-2">Description</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 mb-4"
              value={newDescription}
              onChangeText={setNewDescription}
              placeholder="Optional description"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Text className="text-xs text-gray-500 mb-2">Priority</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {(["LOW", "NORMAL", "HIGH", "URGENT"] as TaskPriority[]).map((priority) => {
                const isSelected = newPriority === priority;
                const style = TASK_PRIORITY_COLORS[priority];
                return (
                  <TouchableOpacity
                    key={priority}
                    className={`rounded-full px-4 py-2 ${isSelected ? "" : "border border-gray-300"}`}
                    style={{ backgroundColor: isSelected ? style.bg : "#FFFFFF" }}
                    onPress={() => setNewPriority(priority)}
                    activeOpacity={0.7}
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: isSelected ? style.text : "#6B7280" }}
                    >
                      {TASK_PRIORITY_LABELS[priority]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className="text-xs text-gray-500 mb-2">Assignee</Text>
            <View className="border border-gray-300 rounded-lg mb-4 overflow-hidden">
              <TouchableOpacity
                className="px-3 py-2.5"
                onPress={() => setNewAssigneeId(null)}
                activeOpacity={0.7}
              >
                <Text className={`text-sm ${newAssigneeId === null ? "text-brand-600 font-semibold" : "text-gray-700"}`}>
                  Unassigned
                </Text>
              </TouchableOpacity>
              {parties.map((party) => (
                <TouchableOpacity
                  key={party.id}
                  className="px-3 py-2.5 border-t border-gray-100"
                  onPress={() => setNewAssigneeId(party.id)}
                  activeOpacity={0.7}
                >
                  <Text className={`text-sm ${newAssigneeId === party.id ? "text-brand-600 font-semibold" : "text-gray-700"}`}>
                    {party.name}
                  </Text>
                  <Text className="text-xs text-gray-500">{party.role}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-xs text-gray-500 mb-2">Due Date</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 mb-4"
              value={newDueDate}
              onChangeText={setNewDueDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Apply Workflow Modal */}
      <Modal visible={showWorkflowModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
          <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
            <TouchableOpacity onPress={() => { setShowWorkflowModal(false); setSelectedWorkflow(null); }} className="mr-3">
              <Text className="text-base text-brand-600 font-medium">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900 flex-1 text-center">Apply Workflow</Text>
            <TouchableOpacity onPress={handleApplyWorkflow} disabled={!selectedWorkflow || applyingWorkflow}>
              <Text className={`text-base font-semibold ${!selectedWorkflow || applyingWorkflow ? "text-gray-400" : "text-brand-600"}`}>
                {applyingWorkflow ? "Applying..." : "Apply"}
              </Text>
            </TouchableOpacity>
          </View>

          {loadingWorkflows ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#2563EB" />
              <Text className="text-sm text-gray-400 mt-3">Loading workflows...</Text>
            </View>
          ) : workflows.length === 0 ? (
            <View className="flex-1 items-center justify-center px-4">
              <Ionicons name="git-branch-outline" size={48} color="#D1D5DB" />
              <Text className="text-sm text-gray-400 mt-3">No workflows available</Text>
            </View>
          ) : (
            <FlatList
              data={workflows}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => {
                const isSelected = selectedWorkflow?.id === item.id;
                return (
                  <TouchableOpacity
                    className={`bg-white rounded-xl p-4 mb-3 border-2 ${isSelected ? "border-brand-600" : "border-gray-200"}`}
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 3,
                      elevation: 1,
                    }}
                    onPress={() => setSelectedWorkflow(item)}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-start">
                      <View className="flex-1">
                        <Text className="text-base font-bold text-gray-900">{item.name}</Text>
                        <View className="flex-row items-center mt-1">
                          <Ionicons name="list-outline" size={14} color="#9CA3AF" style={{ marginRight: 4 }} />
                          <Text className="text-xs text-gray-500">
                            {item.steps.length} step{item.steps.length !== 1 ? "s" : ""}
                          </Text>
                        </View>
                      </View>
                      {isSelected && <Ionicons name="checkmark-circle" size={24} color="#2563EB" />}
                    </View>

                    {isSelected && item.steps.length > 0 && (
                      <View className="mt-3 pt-3 border-t border-gray-100">
                        <Text className="text-xs font-semibold text-gray-700 mb-2">Steps Preview:</Text>
                        {item.steps.map((step, idx) => (
                          <View key={idx} className="flex-row items-start mb-1.5">
                            <Text className="text-xs text-gray-500 mr-2">{idx + 1}.</Text>
                            <Text className="flex-1 text-xs text-gray-600">{step.title}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
