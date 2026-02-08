import { useState } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "@/services/api";

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["READY_TO_SUBMIT"],
  READY_TO_SUBMIT: ["SUBMITTED", "DRAFT"],
  SUBMITTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["CORRECTIONS_NEEDED", "APPROVED", "DENIED"],
  CORRECTIONS_NEEDED: ["RESUBMITTED"],
  RESUBMITTED: ["UNDER_REVIEW"],
  APPROVED: ["PERMIT_ISSUED"],
  PERMIT_ISSUED: ["INSPECTION_SCHEDULED"],
  INSPECTION_SCHEDULED: ["INSPECTION_PASSED", "INSPECTION_FAILED"],
  INSPECTION_PASSED: ["CERTIFICATE_OF_OCCUPANCY"],
  INSPECTION_FAILED: ["INSPECTION_SCHEDULED"],
  CERTIFICATE_OF_OCCUPANCY: ["CLOSED"],
  DENIED: ["DRAFT"],
  EXPIRED: ["DRAFT"],
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  READY_TO_SUBMIT: "Ready to Submit",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  CORRECTIONS_NEEDED: "Corrections Needed",
  RESUBMITTED: "Resubmitted",
  APPROVED: "Approved",
  DENIED: "Denied",
  PERMIT_ISSUED: "Permit Issued",
  INSPECTION_SCHEDULED: "Inspection Scheduled",
  INSPECTION_PASSED: "Inspection Passed",
  INSPECTION_FAILED: "Inspection Failed",
  CERTIFICATE_OF_OCCUPANCY: "Certificate of Occupancy",
  CLOSED: "Closed",
  EXPIRED: "Expired",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#6B7280",
  READY_TO_SUBMIT: "#2563EB",
  SUBMITTED: "#2563EB",
  UNDER_REVIEW: "#D97706",
  CORRECTIONS_NEEDED: "#DC2626",
  RESUBMITTED: "#D97706",
  APPROVED: "#059669",
  DENIED: "#DC2626",
  PERMIT_ISSUED: "#059669",
  INSPECTION_SCHEDULED: "#7C3AED",
  INSPECTION_PASSED: "#059669",
  INSPECTION_FAILED: "#DC2626",
  CERTIFICATE_OF_OCCUPANCY: "#059669",
  CLOSED: "#6B7280",
  EXPIRED: "#6B7280",
};

interface StatusUpdateModalProps {
  visible: boolean;
  onClose: () => void;
  permitId: string;
  currentStatus: string;
  onStatusUpdated: (newStatus: string) => void;
}

export default function StatusUpdateModal({
  visible,
  onClose,
  permitId,
  currentStatus,
  onStatusUpdated,
}: StatusUpdateModalProps) {
  const [updating, setUpdating] = useState(false);
  const nextStatuses = STATUS_TRANSITIONS[currentStatus] || [];

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      await api.patch(`/permits/${permitId}/status`, { status: newStatus });
      onStatusUpdated(newStatus);
      onClose();
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to update status.";
      Alert.alert("Error", message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl px-6 pb-10 pt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">Update Status</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1">Current Status</Text>
            <View className="flex-row items-center">
              <View
                className="w-2.5 h-2.5 rounded-full mr-2"
                style={{ backgroundColor: STATUS_COLORS[currentStatus] || "#6B7280" }}
              />
              <Text className="text-sm font-semibold text-gray-900">
                {STATUS_LABELS[currentStatus] || currentStatus}
              </Text>
            </View>
          </View>

          {nextStatuses.length === 0 ? (
            <View className="items-center py-6">
              <Ionicons name="checkmark-circle" size={40} color="#059669" />
              <Text className="text-sm text-gray-500 mt-2">This permit has reached its final status.</Text>
            </View>
          ) : (
            <ScrollView>
              <Text className="text-xs text-gray-500 mb-3">Move to:</Text>
              {nextStatuses.map((status) => (
                <TouchableOpacity
                  key={status}
                  className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3.5 mb-2"
                  onPress={() => handleStatusChange(status)}
                  disabled={updating}
                  activeOpacity={0.7}
                >
                  <View
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: STATUS_COLORS[status] || "#6B7280" }}
                  />
                  <Text className="text-sm font-medium text-gray-900 flex-1">
                    {STATUS_LABELS[status] || status}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
