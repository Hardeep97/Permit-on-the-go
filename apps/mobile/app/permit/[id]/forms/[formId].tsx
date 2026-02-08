import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "@/services/api";
import { FormRenderer } from "@/components/FormRenderer";

interface FormSubmission {
  id: string;
  status: string;
  data: Record<string, unknown>;
  template: {
    id: string;
    name: string;
    subcodeType: string;
    schema: {
      sections: {
        id: string;
        title: string;
        description?: string;
        fields: {
          id: string;
          type: string;
          label: string;
          placeholder?: string;
          required?: boolean;
          options?: string[];
          helpText?: string;
          conditionalOn?: { field: string; value: unknown };
          defaultValue?: unknown;
        }[];
      }[];
    };
  };
}

export default function FormDetailScreen() {
  const { id: permitId, formId } = useLocalSearchParams<{ id: string; formId: string }>();
  const router = useRouter();
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmission = useCallback(async () => {
    try {
      const res = await api.get(`/permits/${permitId}/forms/${formId}`);
      setSubmission(res.data?.data);
    } catch {
      setError("Failed to load form");
    } finally {
      setLoading(false);
    }
  }, [permitId, formId]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  const handleSaveDraft = async (data: Record<string, unknown>) => {
    await api.patch(`/permits/${permitId}/forms/${formId}`, {
      data,
      status: "DRAFT",
    });
  };

  const handleSubmit = async (data: Record<string, unknown>) => {
    await api.patch(`/permits/${permitId}/forms/${formId}`, {
      data,
      status: "SUBMITTED",
    });
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  if (error || !submission) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="mt-3 text-sm text-red-600">{error || "Form not found"}</Text>
        <TouchableOpacity onPress={fetchSubmission} className="mt-4">
          <Text className="text-sm text-blue-600 font-medium">Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isReadOnly = submission.status !== "DRAFT";

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
              {submission.template.name}
            </Text>
            <View className="flex-row items-center gap-2 mt-0.5">
              <Text className="text-xs text-gray-500">{submission.template.subcodeType}</Text>
              <View
                className={`rounded-full px-2 py-0.5 ${
                  submission.status === "DRAFT"
                    ? "bg-gray-100"
                    : submission.status === "SUBMITTED"
                      ? "bg-blue-100"
                      : submission.status === "APPROVED"
                        ? "bg-green-100"
                        : "bg-red-100"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    submission.status === "DRAFT"
                      ? "text-gray-700"
                      : submission.status === "SUBMITTED"
                        ? "text-blue-700"
                        : submission.status === "APPROVED"
                          ? "text-green-700"
                          : "text-red-700"
                  }`}
                >
                  {submission.status}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {isReadOnly && (
          <View className="bg-amber-50 px-4 py-2">
            <Text className="text-xs text-amber-700">
              This form has been submitted and is read-only.
            </Text>
          </View>
        )}

        <FormRenderer
          schema={submission.template.schema}
          initialData={submission.data}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          readOnly={isReadOnly}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
