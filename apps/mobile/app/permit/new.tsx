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
import { router } from "expo-router";
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

export default function NewPermitScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [projectType, setProjectType] = useState("");
  const [subcodeType, setSubcodeType] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);
  const [showProjectTypePicker, setShowProjectTypePicker] = useState(false);
  const [showSubcodePicker, setShowSubcodePicker] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await api.get("/properties", { params: { pageSize: 100 } });
      setProperties(response.data.properties || []);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    } finally {
      setLoadingProperties(false);
    }
  };

  const selectedProperty = properties.find((p) => p.id === propertyId);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Validation", "Please enter a permit title.");
      return;
    }
    if (!propertyId) {
      Alert.alert("Validation", "Please select a property.");
      return;
    }
    if (!subcodeType) {
      Alert.alert("Validation", "Please select a subcode type.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || undefined,
        propertyId,
        subcodeType,
        priority,
      };
      if (projectType) payload.projectType = projectType;
      if (estimatedValue) payload.estimatedValue = parseFloat(estimatedValue);

      const response = await api.post("/permits", payload);
      Alert.alert("Success", "Permit created successfully!", [
        { text: "OK", onPress: () => router.replace(`/permit/${response.data.id}`) },
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.error || "Failed to create permit.";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 flex-1">Create Permit</Text>
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
              placeholder="e.g. Building Permit - Kitchen Renovation"
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
              placeholder="Describe the work to be done..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 100 }}
            />
          </View>

          {/* Property Picker */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-1.5">
              Property <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex-row items-center justify-between"
              onPress={() => setShowPropertyPicker(!showPropertyPicker)}
            >
              <Text className={`text-sm ${selectedProperty ? "text-gray-900" : "text-gray-400"}`}>
                {selectedProperty ? selectedProperty.name : "Select a property..."}
              </Text>
              <Ionicons
                name={showPropertyPicker ? "chevron-up" : "chevron-down"}
                size={18}
                color="#9CA3AF"
              />
            </TouchableOpacity>
            {showPropertyPicker && (
              <View className="bg-white border border-gray-200 rounded-xl mt-1 overflow-hidden">
                {loadingProperties ? (
                  <View className="py-4 items-center">
                    <ActivityIndicator size="small" color="#2563EB" />
                  </View>
                ) : properties.length === 0 ? (
                  <View className="py-4 items-center">
                    <Text className="text-sm text-gray-400">No properties found</Text>
                    <TouchableOpacity
                      className="mt-2"
                      onPress={() => router.push("/property/new")}
                    >
                      <Text className="text-sm text-brand-600 font-medium">Add a property</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  properties.map((prop) => (
                    <TouchableOpacity
                      key={prop.id}
                      className={`px-4 py-3 border-b border-gray-50 ${
                        propertyId === prop.id ? "bg-brand-50" : ""
                      }`}
                      onPress={() => {
                        setPropertyId(prop.id);
                        setShowPropertyPicker(false);
                      }}
                    >
                      <Text className="text-sm font-medium text-gray-900">{prop.name}</Text>
                      <Text className="text-xs text-gray-500 mt-0.5">
                        {prop.address}, {prop.city}, {prop.state}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>

          {/* Subcode Type Picker */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-1.5">
              Subcode Type <Text className="text-red-500">*</Text>
            </Text>
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

          {/* Submit Button */}
          <TouchableOpacity
            className="bg-brand-600 rounded-xl py-4 items-center flex-row justify-center"
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
            style={submitting ? { opacity: 0.6 } : undefined}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            )}
            <Text className="text-white text-base font-bold">
              {submitting ? "Creating..." : "Create Permit"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
