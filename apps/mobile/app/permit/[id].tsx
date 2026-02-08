import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import api from "@/services/api";
import StatusBadge from "@/components/StatusBadge";
import TimelineView from "@/components/TimelineView";
import PhotoGrid from "@/components/PhotoGrid";
import StatusUpdateModal from "@/components/StatusUpdateModal";
import UploadProgressBar from "@/components/UploadProgressBar";
import { useImagePicker } from "@/hooks/useImagePicker";
import { useDocumentPicker } from "@/hooks/useDocumentPicker";
import { useUpload } from "@/hooks/useUpload";

const SUBCODE_LABELS: Record<string, string> = {
  BUILDING: "Building",
  PLUMBING: "Plumbing",
  ELECTRICAL: "Electrical",
  FIRE: "Fire Protection",
  ZONING: "Zoning",
  MECHANICAL: "Mechanical",
};

const PROJECT_TYPE_LABELS: Record<string, string> = {
  NEW_CONSTRUCTION: "New Construction",
  RENOVATION: "Renovation",
  ADDITION: "Addition",
  DEMOLITION: "Demolition",
  CHANGE_OF_USE: "Change of Use",
  INTERIOR_ALTERATION: "Interior Alteration",
  REPAIR: "Repair",
  ACCESSORY_STRUCTURE: "Accessory Structure",
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  LOW: { bg: "#F3F4F6", text: "#6B7280" },
  NORMAL: { bg: "#EFF6FF", text: "#2563EB" },
  HIGH: { bg: "#FEF3C7", text: "#D97706" },
  URGENT: { bg: "#FEF2F2", text: "#DC2626" },
};

type TabKey = "timeline" | "documents" | "photos" | "inspections";

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "timeline", label: "Timeline", icon: "time-outline" },
  { key: "documents", label: "Documents", icon: "document-outline" },
  { key: "photos", label: "Photos", icon: "camera-outline" },
  { key: "inspections", label: "Inspections", icon: "clipboard-outline" },
];

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(value: number | null | undefined): string {
  if (!value) return "--";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default function PermitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [permit, setPermit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("timeline");

  // Tab data
  const [timeline, setTimeline] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  // Collaboration counts
  const [messageCount, setMessageCount] = useState(0);
  const [partyCount, setPartyCount] = useState(0);

  // Status update modal
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Upload hooks
  const imagePicker = useImagePicker();
  const documentPicker = useDocumentPicker();
  const { upload, uploading, progress } = useUpload();

  const fetchPermit = useCallback(async () => {
    try {
      const response = await api.get(`/permits/${id}`);
      setPermit(response.data);
    } catch (error: any) {
      console.error("Failed to fetch permit:", error);
      if (error.response?.status === 404) {
        Alert.alert("Not Found", "Permit not found.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  const fetchCollaborationCounts = useCallback(async () => {
    try {
      const [messagesRes, partiesRes] = await Promise.all([
        api.get(`/permits/${id}/messages`).catch(() => null),
        api.get(`/permits/${id}/parties`).catch(() => null),
      ]);

      const messages = messagesRes?.data?.messages ?? messagesRes?.data ?? [];
      const parties = partiesRes?.data?.parties ?? partiesRes?.data ?? [];

      setMessageCount(Array.isArray(messages) ? messages.length : 0);
      setPartyCount(Array.isArray(parties) ? parties.length : 0);
    } catch (error) {
      console.error("Failed to fetch collaboration counts:", error);
    }
  }, [id]);

  const fetchTabData = useCallback(async (tab: TabKey) => {
    setTabLoading(true);
    try {
      switch (tab) {
        case "timeline": {
          const res = await api.get(`/permits/${id}/timeline`);
          setTimeline(res.data);
          break;
        }
        case "documents": {
          const res = await api.get(`/permits/${id}/documents`);
          setDocuments(res.data);
          break;
        }
        case "photos": {
          const res = await api.get(`/permits/${id}/photos`);
          setPhotos(res.data);
          break;
        }
        case "inspections": {
          const res = await api.get(`/permits/${id}/inspections`);
          setInspections(res.data);
          break;
        }
      }
    } catch (error) {
      console.error(`Failed to fetch ${tab}:`, error);
    } finally {
      setTabLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPermit();
    fetchCollaborationCounts();
  }, [fetchPermit, fetchCollaborationCounts]);

  useEffect(() => {
    if (permit) {
      fetchTabData(activeTab);
    }
  }, [activeTab, permit, fetchTabData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPermit();
    fetchCollaborationCounts();
    fetchTabData(activeTab);
  }, [fetchPermit, fetchCollaborationCounts, fetchTabData, activeTab]);

  // ---- Photo upload handler ----
  const handleAddPhoto = async () => {
    const result = await imagePicker.showPickerOptions();
    if (!result) return;

    Alert.prompt?.(
      "Add Caption",
      "Optional caption for this photo:",
      [
        { text: "Skip", onPress: () => doPhotoUpload(result.uri, result.fileName, result.mimeType) },
        {
          text: "Add",
          onPress: (caption) => doPhotoUpload(result.uri, result.fileName, result.mimeType, caption),
        },
      ],
      "plain-text"
    ) ?? doPhotoUpload(result.uri, result.fileName, result.mimeType);
  };

  const doPhotoUpload = async (uri: string, fileName: string, mimeType: string, caption?: string) => {
    const extraFields: Record<string, string> = {};
    if (caption) extraFields.caption = caption;

    const uploadResult = await upload({
      uri,
      fileName,
      mimeType,
      endpoint: `/permits/${id}/photos`,
      extraFields,
    });

    if (uploadResult.success) {
      fetchTabData("photos");
      Alert.alert("Success", "Photo uploaded successfully!");
    }
  };

  // ---- Document upload handler ----
  const handleUploadDoc = async () => {
    const result = await documentPicker.pickDocument();
    if (!result) return;

    const uploadResult = await upload({
      uri: result.uri,
      fileName: result.name,
      mimeType: result.mimeType,
      endpoint: `/permits/${id}/documents`,
      extraFields: {
        title: result.name,
        category: "OTHER",
      },
    });

    if (uploadResult.success) {
      fetchTabData("documents");
      Alert.alert("Success", "Document uploaded successfully!");
    }
  };

  // ---- Status updated handler ----
  const handleStatusUpdated = (newStatus: string) => {
    setPermit((prev: any) => prev ? { ...prev, status: newStatus } : prev);
    fetchTabData("timeline");
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={["top"]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-sm text-gray-400 mt-3">Loading permit...</Text>
      </SafeAreaView>
    );
  }

  if (!permit) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={["top"]}>
        <Ionicons name="alert-circle-outline" size={48} color="#D1D5DB" />
        <Text className="text-base text-gray-400 mt-3">Permit not found</Text>
        <TouchableOpacity className="mt-4" onPress={() => router.back()}>
          <Text className="text-brand-600 font-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const priorityStyle = PRIORITY_COLORS[permit.priority] || PRIORITY_COLORS.NORMAL;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 flex-1" numberOfLines={1}>
          {permit.title}
        </Text>
        <TouchableOpacity
          onPress={() => router.push(`/permit/${id}/edit`)}
          className="p-1"
        >
          <Ionicons name="create-outline" size={22} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Upload progress bar */}
      <UploadProgressBar progress={progress} visible={uploading} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
      >
        {/* Status Badge (large) */}
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row items-center">
            <StatusBadge status={permit.status?.toLowerCase()} size="md" />
            {permit.permitNumber ? (
              <View className="ml-3 bg-gray-100 rounded-full px-3 py-1">
                <Text className="text-xs font-mono font-medium text-gray-600">
                  #{permit.permitNumber}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Info Section */}
        <View
          className="mx-4 mt-2 bg-white rounded-2xl p-4"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          {/* Property */}
          {permit.property && (
            <TouchableOpacity
              className="flex-row items-center mb-3 pb-3 border-b border-gray-100"
              onPress={() => router.push(`/property/${permit.property.id}`)}
            >
              <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center mr-3">
                <Ionicons name="business-outline" size={16} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500">Property</Text>
                <Text className="text-sm font-semibold text-gray-900">{permit.property.name}</Text>
                <Text className="text-xs text-gray-500">
                  {permit.property.address}, {permit.property.city}, {permit.property.state}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>
          )}

          {/* Details grid */}
          <View className="flex-row flex-wrap">
            <View className="w-1/2 mb-3 pr-2">
              <Text className="text-xs text-gray-500">Subcode</Text>
              <Text className="text-sm font-medium text-gray-900">
                {SUBCODE_LABELS[permit.subcodeType] || permit.subcodeType || "--"}
              </Text>
            </View>
            <View className="w-1/2 mb-3 pl-2">
              <Text className="text-xs text-gray-500">Project Type</Text>
              <Text className="text-sm font-medium text-gray-900">
                {PROJECT_TYPE_LABELS[permit.projectType] || permit.projectType || "--"}
              </Text>
            </View>
            <View className="w-1/2 mb-3 pr-2">
              <Text className="text-xs text-gray-500">Priority</Text>
              <View className="flex-row items-center mt-0.5">
                <View
                  className="rounded-full px-2 py-0.5"
                  style={{ backgroundColor: priorityStyle.bg }}
                >
                  <Text className="text-xs font-semibold" style={{ color: priorityStyle.text }}>
                    {permit.priority || "NORMAL"}
                  </Text>
                </View>
              </View>
            </View>
            <View className="w-1/2 mb-3 pl-2">
              <Text className="text-xs text-gray-500">Est. Value</Text>
              <Text className="text-sm font-medium text-gray-900">
                {formatCurrency(permit.estimatedValue)}
              </Text>
            </View>
            <View className="w-1/2 mb-3 pr-2">
              <Text className="text-xs text-gray-500">Created</Text>
              <Text className="text-sm font-medium text-gray-900">
                {formatDate(permit.createdAt)}
              </Text>
            </View>
            <View className="w-1/2 mb-3 pl-2">
              <Text className="text-xs text-gray-500">Submitted</Text>
              <Text className="text-sm font-medium text-gray-900">
                {formatDate(permit.submittedAt)}
              </Text>
            </View>
            <View className="w-1/2 pr-2">
              <Text className="text-xs text-gray-500">Approved</Text>
              <Text className="text-sm font-medium text-gray-900">
                {formatDate(permit.approvedAt)}
              </Text>
            </View>
            <View className="w-1/2 pl-2">
              <Text className="text-xs text-gray-500">Expires</Text>
              <Text className="text-sm font-medium text-gray-900">
                {formatDate(permit.expiresAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row px-4 mt-4 gap-2">
          <TouchableOpacity
            className="flex-1 bg-white rounded-xl py-3 flex-row items-center justify-center"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 1,
            }}
            onPress={() => setShowStatusModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-forward-circle-outline" size={18} color="#2563EB" style={{ marginRight: 6 }} />
            <Text className="text-xs font-semibold text-brand-600">Update Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-white rounded-xl py-3 flex-row items-center justify-center"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 1,
            }}
            onPress={handleAddPhoto}
            disabled={uploading || imagePicker.loading}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-outline" size={18} color="#059669" style={{ marginRight: 6 }} />
            <Text className="text-xs font-semibold text-emerald-600">Add Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-white rounded-xl py-3 flex-row items-center justify-center"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 1,
            }}
            onPress={handleUploadDoc}
            disabled={uploading || documentPicker.loading}
            activeOpacity={0.7}
          >
            <Ionicons name="document-attach-outline" size={18} color="#7C3AED" style={{ marginRight: 6 }} />
            <Text className="text-xs font-semibold text-purple-600">Upload Doc</Text>
          </TouchableOpacity>
        </View>

        {/* Collaboration Actions (Messages & Parties) */}
        <View className="flex-row px-4 mt-2 gap-2">
          <TouchableOpacity
            className="flex-1 bg-white rounded-xl py-3 flex-row items-center justify-center"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 1,
            }}
            onPress={() => router.push(`/permit/${id}/messages`)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubbles-outline" size={18} color="#2563EB" style={{ marginRight: 6 }} />
            <Text className="text-xs font-semibold text-brand-600">Messages</Text>
            {messageCount > 0 && (
              <View className="bg-blue-100 rounded-full px-1.5 py-0.5 ml-1.5">
                <Text className="text-[10px] font-bold text-blue-600">
                  {messageCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-white rounded-xl py-3 flex-row items-center justify-center"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 1,
            }}
            onPress={() => router.push(`/permit/${id}/parties`)}
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={18} color="#059669" style={{ marginRight: 6 }} />
            <Text className="text-xs font-semibold text-emerald-600">Parties</Text>
            {partyCount > 0 && (
              <View className="bg-green-100 rounded-full px-1.5 py-0.5 ml-1.5">
                <Text className="text-[10px] font-bold text-green-600">
                  {partyCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Forms & AI Actions */}
        <View className="flex-row px-4 mt-2 gap-2">
          <TouchableOpacity
            className="flex-1 bg-white rounded-xl py-3 flex-row items-center justify-center"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 1,
            }}
            onPress={() => router.push(`/permit/${id}/forms` as never)}
            activeOpacity={0.7}
          >
            <Ionicons name="document-text-outline" size={18} color="#7C3AED" style={{ marginRight: 6 }} />
            <Text className="text-xs font-semibold text-purple-600">Subcode Forms</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Segments */}
        <View className="mt-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                className={`rounded-full px-4 py-2 flex-row items-center ${
                  activeTab === tab.key
                    ? "bg-brand-600"
                    : "bg-white border border-gray-200"
                }`}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon}
                  size={14}
                  color={activeTab === tab.key ? "#FFFFFF" : "#6B7280"}
                  style={{ marginRight: 4 }}
                />
                <Text
                  className={`text-sm font-medium ${
                    activeTab === tab.key ? "text-white" : "text-gray-600"
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tab Content */}
        <View className="mt-2 pb-8">
          {activeTab === "timeline" && (
            <TimelineView events={timeline} loading={tabLoading} />
          )}

          {activeTab === "documents" && (
            <DocumentsList documents={documents} loading={tabLoading} onUploadPress={handleUploadDoc} />
          )}

          {activeTab === "photos" && (
            <PhotoGrid photos={photos} loading={tabLoading} permitId={id!} onUploadPress={handleAddPhoto} />
          )}

          {activeTab === "inspections" && (
            <InspectionsList inspections={inspections} loading={tabLoading} permitId={id!} onRefresh={() => fetchTabData("inspections")} />
          )}
        </View>
      </ScrollView>

      {/* Status Update Modal */}
      <StatusUpdateModal
        visible={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        permitId={id!}
        currentStatus={permit.status}
        onStatusUpdated={handleStatusUpdated}
      />
    </SafeAreaView>
  );
}

// ---- Documents sub-component ----
function DocumentsList({ documents, loading, onUploadPress }: { documents: any[]; loading: boolean; onUploadPress: () => void }) {
  if (loading) {
    return (
      <View className="items-center justify-center py-12">
        <Text className="text-sm text-gray-400">Loading documents...</Text>
      </View>
    );
  }

  if (documents.length === 0) {
    return (
      <View className="items-center justify-center py-12">
        <Ionicons name="document-outline" size={40} color="#D1D5DB" />
        <Text className="text-sm text-gray-400 mt-3">No documents yet</Text>
        <TouchableOpacity
          className="mt-4 bg-brand-600 rounded-xl px-5 py-2.5 flex-row items-center"
          onPress={onUploadPress}
          activeOpacity={0.8}
        >
          <Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text className="text-white text-sm font-semibold">Upload Document</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
    PERMIT_APPLICATION: { bg: "#EFF6FF", text: "#2563EB" },
    PLANS: { bg: "#F5F3FF", text: "#7C3AED" },
    APPROVAL: { bg: "#ECFDF5", text: "#059669" },
    INSPECTION: { bg: "#FEF3C7", text: "#D97706" },
    CORRESPONDENCE: { bg: "#FFF7ED", text: "#EA580C" },
    OTHER: { bg: "#F3F4F6", text: "#6B7280" },
  };

  return (
    <View className="px-4 pt-4">
      {documents.map((doc: any) => {
        const catStyle = CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.OTHER;
        return (
          <View
            key={doc.id}
            className="bg-white rounded-xl p-4 mb-2"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 1,
            }}
          >
            <View className="flex-row items-start">
              <View className="w-9 h-9 rounded-lg bg-gray-100 items-center justify-center mr-3">
                <Ionicons name="document-text-outline" size={18} color="#6B7280" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                  {doc.title}
                </Text>
                <View className="flex-row items-center mt-1">
                  <View
                    className="rounded-full px-2 py-0.5 mr-2"
                    style={{ backgroundColor: catStyle.bg }}
                  >
                    <Text className="text-[10px] font-semibold" style={{ color: catStyle.text }}>
                      {(doc.category || "OTHER").replace(/_/g, " ")}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-400">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ---- Inspections sub-component ----
function InspectionsList({
  inspections,
  loading,
  permitId,
  onRefresh,
}: {
  inspections: any[];
  loading: boolean;
  permitId: string;
  onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSchedule = async () => {
    if (!formType.trim()) {
      Alert.alert("Required", "Please enter an inspection type.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/permits/${permitId}/inspections`, { type: formType.trim() });
      setFormType("");
      setShowForm(false);
      onRefresh();
      Alert.alert("Success", "Inspection scheduled!");
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.error || "Failed to schedule inspection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="items-center justify-center py-12">
        <Text className="text-sm text-gray-400">Loading inspections...</Text>
      </View>
    );
  }

  const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    SCHEDULED: { bg: "#EFF6FF", text: "#2563EB" },
    NOT_SCHEDULED: { bg: "#F3F4F6", text: "#6B7280" },
    PASSED: { bg: "#ECFDF5", text: "#059669" },
    FAILED: { bg: "#FEF2F2", text: "#DC2626" },
    CANCELLED: { bg: "#F3F4F6", text: "#6B7280" },
  };

  return (
    <View className="px-4 pt-4">
      {/* Schedule button */}
      <TouchableOpacity
        className="bg-brand-600 rounded-xl py-3 flex-row items-center justify-center mb-4"
        onPress={() => setShowForm(!showForm)}
        activeOpacity={0.8}
      >
        <Ionicons name={showForm ? "close" : "add"} size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text className="text-white text-sm font-semibold">
          {showForm ? "Cancel" : "Schedule Inspection"}
        </Text>
      </TouchableOpacity>

      {/* Quick schedule form */}
      {showForm && (
        <View
          className="bg-white rounded-xl p-4 mb-4"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          <Text className="text-xs text-gray-500 mb-2">Inspection Type</Text>
          <View className="border border-gray-200 rounded-lg px-3 py-2.5 mb-3">
            <Text className="text-sm text-gray-900">
              {formType || (
                <Text
                  className="text-gray-400"
                  onPress={() =>
                    Alert.prompt("Inspection Type", "e.g., Foundation, Framing, Final", [
                      { text: "Cancel", style: "cancel" },
                      { text: "OK", onPress: (val) => setFormType(val || "") },
                    ])
                  }
                >
                  Tap to enter type...
                </Text>
              )}
            </Text>
          </View>
          <TouchableOpacity
            className="bg-brand-600 rounded-lg py-2.5 items-center"
            onPress={handleSchedule}
            disabled={submitting}
          >
            <Text className="text-white text-sm font-semibold">
              {submitting ? "Scheduling..." : "Schedule"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {inspections.length === 0 && !showForm ? (
        <View className="items-center justify-center py-8">
          <Ionicons name="clipboard-outline" size={40} color="#D1D5DB" />
          <Text className="text-sm text-gray-400 mt-3">No inspections scheduled</Text>
        </View>
      ) : (
        inspections.map((insp: any) => {
          const statusStyle = STATUS_COLORS[insp.status] || STATUS_COLORS.NOT_SCHEDULED;
          return (
            <View
              key={insp.id}
              className="bg-white rounded-xl p-4 mb-2"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-3">
                  <Text className="text-sm font-semibold text-gray-900">
                    {insp.type} Inspection
                  </Text>
                  <View className="flex-row items-center mt-1.5">
                    <Ionicons name="calendar-outline" size={13} color="#9CA3AF" style={{ marginRight: 4 }} />
                    <Text className="text-xs text-gray-500">
                      {insp.scheduledDate
                        ? new Date(insp.scheduledDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "Not scheduled"}
                    </Text>
                  </View>
                  {insp.inspectorName ? (
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="person-outline" size={13} color="#9CA3AF" style={{ marginRight: 4 }} />
                      <Text className="text-xs text-gray-500">{insp.inspectorName}</Text>
                    </View>
                  ) : null}
                </View>
                <View
                  className="rounded-full px-2.5 py-1"
                  style={{ backgroundColor: statusStyle.bg }}
                >
                  <Text className="text-[10px] font-semibold" style={{ color: statusStyle.text }}>
                    {(insp.status || "NOT_SCHEDULED").replace(/_/g, " ")}
                  </Text>
                </View>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}
