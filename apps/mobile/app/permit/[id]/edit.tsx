import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import api from "@/services/api";

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

const SUBCODE_LABELS: Record<string, string> = {
  BUILDING: "Building",
  PLUMBING: "Plumbing",
  ELECTRICAL: "Electrical",
  FIRE: "Fire Protection",
  ZONING: "Zoning",
  MECHANICAL: "Mechanical",
};

const PRIORITY_OPTIONS = [
  { key: "LOW", label: "Low", color: "#6B7280" },
  { key: "NORMAL", label: "Normal", color: "#2563EB" },
  { key: "HIGH", label: "High", color: "#F59E0B" },
  { key: "URGENT", label: "Urgent", color: "#DC2626" },
];

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
}

export default function EditPermitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [projectType, setProjectType] = useState("");
  const [subcodeType, setSubcodeType] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);
  const [showProjectTypePicker, setShowProjectTypePicker] = useState(false);
  const [showSubcodePicker, setShowSubcodePicker] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [permitRes, propsRes] = await Promise.all([
        api.get(`/permits/${id}`),
        api.get("/properties", { params: { pageSize: 100 } }),
      ]);

      const permit = permitRes.data;
      setTitle(permit.title || "");
      setDescription(permit.description || "");
      setPropertyId(permit.propertyId || "");
      setProjectType(permit.projectType || "");
      setSubcodeType(permit.subcodeType || "");
      setPriority(permit.priority || "NORMAL");
      setEstimatedValue(permit.estimatedValue ? String(permit.estimatedValue) : "");
      setProperties(propsRes.data.properties || []);
    } catch (error) {
      console.error("Failed to fetch permit:", error);
      Alert.alert("Error", "Failed to load permit data.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const selectedProperty = properties.find((p) => p.id === propertyId);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Validation", "Please enter a permit title.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || undefined,
        subcodeType: subcodeType || undefined,
        priority,
      };
      if (projectType) payload.projectType = projectType;
      if (estimatedValue) payload.estimatedValue = parseFloat(estimatedValue);

      await api.patch(`/permits/${id}`, payload);
      Alert.alert("Success", "Permit updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.error || "Failed to update permit.";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={["top"]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-sm text-gray-400 mt-3">Loading permit...</Text>
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
        <Text className="text-lg font-bold text-gray-900 flex-1">Edit Permit</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={submitting}
          className="bg-brand-600 rounded-lg px-4 py-2"
          activeOpacity={0.8}
          style={submitting ? { opacity: 0.6 } : undefined}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white text-sm font-semibold">Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-1.5">
              Title <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
              placeholder="Permit title"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-1.5">Description</Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
              placeholder="Describe the work..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 100 }}
            />
          </View>

          {/* Property (display only, cannot change) */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-1.5">Property</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <Text className="text-sm text-gray-600">
                {selectedProperty ? selectedProperty.name : "Property assigned"}
              </Text>
              {selectedProperty && (
                <Text className="text-xs text-gray-400 mt-0.5">
                  {selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state}
                </Text>
              )}
            </View>
          </View>

          {/* Subcode Type Picker */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-1.5">Subcode Type</Text>
            <TouchableOpacity
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex-row items-center justify-between"
              onPress={() => setShowSubcodePicker(!showSubcodePicker)}
            >
              <Text className={`text-sm ${subcodeType ? "text-gray-900" : "text-gray-400"}`}>
                {subcodeType ? SUBCODE_LABELS[subcodeType] : "Select subcode type..."}
              </Text>
              <Ionicons
                name={showSubcodePicker ? "chevron-up" : "chevron-down"}
                size={18}
                color="#9CA3AF"
              />
            </TouchableOpacity>
            {showSubcodePicker && (
              <View className="bg-white border border-gray-200 rounded-xl mt-1 overflow-hidden">
                {Object.entries(SUBCODE_LABELS).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    className={`px-4 py-3 border-b border-gray-50 ${
                      subcodeType === key ? "bg-brand-50" : ""
                    }`}
                    onPress={() => {
                      setSubcodeType(key);
                      setShowSubcodePicker(false);
                    }}
                  >
                    <Text className="text-sm text-gray-900">{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Project Type Picker */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-1.5">Project Type</Text>
            <TouchableOpacity
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex-row items-center justify-between"
              onPress={() => setShowProjectTypePicker(!showProjectTypePicker)}
            >
              <Text className={`text-sm ${projectType ? "text-gray-900" : "text-gray-400"}`}>
                {projectType ? PROJECT_TYPE_LABELS[projectType] : "Select project type..."}
              </Text>
              <Ionicons
                name={showProjectTypePicker ? "chevron-up" : "chevron-down"}
                size={18}
                color="#9CA3AF"
              />
            </TouchableOpacity>
            {showProjectTypePicker && (
              <View className="bg-white border border-gray-200 rounded-xl mt-1 overflow-hidden">
                {Object.entries(PROJECT_TYPE_LABELS).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    className={`px-4 py-3 border-b border-gray-50 ${
                      projectType === key ? "bg-brand-50" : ""
                    }`}
                    onPress={() => {
                      setProjectType(key);
                      setShowProjectTypePicker(false);
                    }}
                  >
                    <Text className="text-sm text-gray-900">{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Priority */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-1.5">Priority</Text>
            <View className="flex-row gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  className={`flex-1 rounded-xl py-2.5 items-center border ${
                    priority === opt.key ? "border-transparent" : "border-gray-200 bg-white"
                  }`}
                  style={
                    priority === opt.key
                      ? { backgroundColor: `${opt.color}15`, borderColor: opt.color, borderWidth: 1.5 }
                      : undefined
                  }
                  onPress={() => setPriority(opt.key)}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: priority === opt.key ? opt.color : "#6B7280" }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Estimated Value */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-1.5">Estimated Value ($)</Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              value={estimatedValue}
              onChangeText={setEstimatedValue}
              keyboardType="numeric"
            />
          </View>

          {/* Save Button (bottom) */}
          <TouchableOpacity
            className="bg-brand-600 rounded-xl py-4 items-center flex-row justify-center"
            onPress={handleSave}
            disabled={submitting}
            activeOpacity={0.8}
            style={submitting ? { opacity: 0.6 } : undefined}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="save-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            )}
            <Text className="text-white text-base font-bold">
              {submitting ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
