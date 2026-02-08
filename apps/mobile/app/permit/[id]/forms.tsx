import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "@/services/api";

interface FormSubmission {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  template: {
    id: string;
    name: string;
    subcodeType: string;
    version: string;
  };
}

interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  subcodeType: string;
  version: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "bg-gray-100", text: "text-gray-700" },
  SUBMITTED: { bg: "bg-blue-100", text: "text-blue-700" },
  APPROVED: { bg: "bg-green-100", text: "text-green-700" },
  REJECTED: { bg: "bg-red-100", text: "text-red-700" },
};

const SUBCODE_ICONS: Record<string, string> = {
  BUILDING: "construct",
  PLUMBING: "water",
  ELECTRICAL: "flash",
  FIRE: "flame",
  ZONING: "map",
  MECHANICAL: "cog",
};

export default function PermitFormsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [subRes, tmplRes] = await Promise.all([
        api.get(`/permits/${id}/forms`),
        api.get("/form-templates"),
      ]);
      setSubmissions(subRes.data?.data ?? []);
      setTemplates(tmplRes.data?.data ?? []);
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const startForm = async (templateId: string) => {
    setCreating(templateId);
    try {
      const res = await api.post(`/permits/${id}/forms`, {
        templateId,
        data: {},
        status: "DRAFT",
      });
      const newForm = res.data?.data;
      if (newForm) {
        router.push(`/permit/${id}/forms/${newForm.id}` as never);
      }
    } catch {
      // Silently handle
    } finally {
      setCreating(null);
      setShowTemplates(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900">Permit Forms</Text>
          <Text className="text-xs text-gray-500">Fill out subcode applications</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowTemplates(!showTemplates)}
          className="bg-blue-600 rounded-xl px-4 py-2"
        >
          <Text className="text-sm font-medium text-white">New Form</Text>
        </TouchableOpacity>
      </View>

      {/* Template Picker */}
      {showTemplates && (
        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Select a Form Template
          </Text>
          {templates.map((tmpl) => (
            <TouchableOpacity
              key={tmpl.id}
              onPress={() => startForm(tmpl.id)}
              disabled={creating === tmpl.id}
              className="flex-row items-center border border-gray-200 rounded-xl p-3 mb-2"
            >
              <Ionicons
                name={(SUBCODE_ICONS[tmpl.subcodeType] || "document") as keyof typeof Ionicons.glyphMap}
                size={20}
                color="#2563EB"
              />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-medium text-gray-900">{tmpl.name}</Text>
                <Text className="text-xs text-gray-500">
                  {tmpl.subcodeType} - v{tmpl.version}
                </Text>
              </View>
              {creating === tmpl.id ? (
                <ActivityIndicator size="small" color="#2563EB" />
              ) : (
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Submissions List */}
      <FlatList
        data={submissions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center py-16">
            <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
            <Text className="mt-3 text-sm text-gray-500">No forms yet.</Text>
            <Text className="text-xs text-gray-400">Tap "New Form" to get started.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const colors = STATUS_COLORS[item.status] || STATUS_COLORS.DRAFT;
          return (
            <TouchableOpacity
              onPress={() => router.push(`/permit/${id}/forms/${item.id}` as never)}
              className="bg-white rounded-2xl p-4 mb-3"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm font-semibold text-gray-900 flex-1" numberOfLines={1}>
                  {item.template.name}
                </Text>
                <View className={`rounded-full px-2 py-0.5 ${colors.bg}`}>
                  <Text className={`text-xs font-medium ${colors.text}`}>{item.status}</Text>
                </View>
              </View>
              <Text className="text-xs text-gray-500">
                {item.template.subcodeType} - Updated {new Date(item.updatedAt).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}
