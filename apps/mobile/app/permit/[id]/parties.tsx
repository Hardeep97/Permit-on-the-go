import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import api from "@/services/api";

interface Party {
  id: string;
  role: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

const ROLES = [
  "OWNER",
  "EXPEDITOR",
  "CONTRACTOR",
  "ARCHITECT",
  "ENGINEER",
  "INSPECTOR",
  "VIEWER",
] as const;

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  OWNER: { bg: "#DBEAFE", text: "#1D4ED8" },
  EXPEDITOR: { bg: "#F3E8FF", text: "#7C3AED" },
  CONTRACTOR: { bg: "#FEF3C7", text: "#D97706" },
  ARCHITECT: { bg: "#ECFDF5", text: "#059669" },
  ENGINEER: { bg: "#FFF7ED", text: "#EA580C" },
  INSPECTOR: { bg: "#FEF2F2", text: "#DC2626" },
  VIEWER: { bg: "#F3F4F6", text: "#6B7280" },
};

export default function PartiesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formRole, setFormRole] = useState<string>("VIEWER");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCompany, setFormCompany] = useState("");

  const fetchParties = useCallback(async () => {
    try {
      const response = await api.get(`/permits/${id}/parties`);
      setParties(response.data?.parties ?? response.data ?? []);
    } catch (error) {
      console.error("Failed to fetch parties:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  const resetForm = () => {
    setFormRole("VIEWER");
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormCompany("");
  };

  const handleAddParty = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      Alert.alert("Required Fields", "Please enter a name and email.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post(`/permits/${id}/parties`, {
        role: formRole,
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim() || undefined,
        company: formCompany.trim() || undefined,
      });

      const newParty: Party = response.data ?? {
        id: Date.now().toString(),
        role: formRole,
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim() || undefined,
        company: formCompany.trim() || undefined,
      };

      setParties((prev) => [...prev, newParty]);
      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error("Failed to add party:", error);
      Alert.alert("Error", "Failed to add party. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getPartyDisplayName = (party: Party): string => {
    return party.user?.name || party.name || "Unknown";
  };

  const getPartyEmail = (party: Party): string => {
    return party.user?.email || party.email || "";
  };

  const handleEditRole = (party: Party) => {
    const options = ROLES.filter((r) => r !== party.role).map((role) => ({
      text: role,
      onPress: async () => {
        try {
          await api.patch(`/permits/${id}/parties/${party.id}`, { role });
          setParties((prev) =>
            prev.map((p) => (p.id === party.id ? { ...p, role } : p))
          );
        } catch {
          Alert.alert("Error", "Failed to update role.");
        }
      },
    }));

    Alert.alert(
      "Change Role",
      `Update ${getPartyDisplayName(party)}'s role:`,
      [...options, { text: "Cancel", style: "cancel" as const, onPress: undefined }]
    );
  };

  const handleDeleteParty = (party: Party) => {
    Alert.alert(
      "Remove Party",
      `Remove ${getPartyDisplayName(party)} from this permit?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/permits/${id}/parties/${party.id}`);
              setParties((prev) => prev.filter((p) => p.id !== party.id));
            } catch {
              Alert.alert("Error", "Failed to remove party.");
            }
          },
        },
      ]
    );
  };

  const renderPartyCard = ({ item }: { item: Party }) => {
    const roleStyle = ROLE_COLORS[item.role] || ROLE_COLORS.VIEWER;

    return (
      <View
        className="mx-4 mb-3 bg-white rounded-xl p-4"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 1,
        }}
      >
        <View className="flex-row items-start">
          {/* Avatar */}
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: roleStyle.bg }}
          >
            <Ionicons name="person" size={18} color={roleStyle.text} />
          </View>

          <View className="flex-1">
            {/* Name and Role */}
            <View className="flex-row items-center">
              <Text className="text-sm font-semibold text-gray-900 flex-1">
                {getPartyDisplayName(item)}
              </Text>
              <TouchableOpacity
                onPress={() => handleEditRole(item)}
                activeOpacity={0.7}
              >
                <View
                  className="rounded-full px-2.5 py-0.5"
                  style={{ backgroundColor: roleStyle.bg }}
                >
                  <Text
                    className="text-[10px] font-semibold"
                    style={{ color: roleStyle.text }}
                  >
                    {item.role}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Email */}
            {getPartyEmail(item) ? (
              <View className="flex-row items-center mt-1.5">
                <Ionicons
                  name="mail-outline"
                  size={13}
                  color="#9CA3AF"
                  style={{ marginRight: 4 }}
                />
                <Text className="text-xs text-gray-500">
                  {getPartyEmail(item)}
                </Text>
              </View>
            ) : null}

            {/* Phone */}
            {item.phone ? (
              <View className="flex-row items-center mt-1">
                <Ionicons
                  name="call-outline"
                  size={13}
                  color="#9CA3AF"
                  style={{ marginRight: 4 }}
                />
                <Text className="text-xs text-gray-500">{item.phone}</Text>
              </View>
            ) : null}

            {/* Company */}
            {item.company ? (
              <View className="flex-row items-center mt-1">
                <Ionicons
                  name="business-outline"
                  size={13}
                  color="#9CA3AF"
                  style={{ marginRight: 4 }}
                />
                <Text className="text-xs text-gray-500">{item.company}</Text>
              </View>
            ) : null}

            {/* Action buttons */}
            <View className="flex-row mt-3 pt-2 border-t border-gray-100">
              <TouchableOpacity
                className="flex-row items-center mr-5"
                onPress={() => handleEditRole(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={14} color="#2563EB" style={{ marginRight: 4 }} />
                <Text className="text-xs font-medium text-blue-600">Edit Role</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => handleDeleteParty(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={14} color="#DC2626" style={{ marginRight: 4 }} />
                <Text className="text-xs font-medium text-red-600">Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 bg-gray-50 items-center justify-center"
        edges={["top"]}
      >
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-sm text-gray-400 mt-3">Loading parties...</Text>
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
        <Text className="text-lg font-bold text-gray-900 flex-1">Parties</Text>
        <TouchableOpacity
          className="bg-brand-600 rounded-lg px-3 py-1.5 flex-row items-center"
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="add"
            size={16}
            color="#FFFFFF"
            style={{ marginRight: 4 }}
          />
          <Text className="text-white text-sm font-semibold">Add Party</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={parties}
        keyExtractor={(item) => item.id}
        renderItem={renderPartyCard}
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: 24,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="people-outline" size={48} color="#D1D5DB" />
            <Text className="text-base text-gray-400 mt-4">
              No parties added yet
            </Text>
            <Text className="text-sm text-gray-400 mt-1">
              Add collaborators to this permit
            </Text>
            <TouchableOpacity
              className="mt-4 bg-brand-600 rounded-xl px-5 py-2.5 flex-row items-center"
              onPress={() => setModalVisible(true)}
            >
              <Ionicons
                name="add"
                size={16}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text className="text-white text-sm font-semibold">
                Add First Party
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add Party Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            {/* Modal Header */}
            <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
                className="mr-3 p-1"
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
              <Text className="text-lg font-bold text-gray-900 flex-1">
                Add Party
              </Text>
              <TouchableOpacity
                onPress={handleAddParty}
                disabled={submitting}
                className="py-1 px-3"
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                  <Text className="text-sm font-semibold text-brand-600">
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView
              className="flex-1 px-4 pt-4"
              keyboardShouldPersistTaps="handled"
            >
              {/* Role Picker */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Role
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {ROLES.map((role) => {
                    const roleStyle = ROLE_COLORS[role] || ROLE_COLORS.VIEWER;
                    const isSelected = formRole === role;

                    return (
                      <TouchableOpacity
                        key={role}
                        className={`rounded-full px-3 py-1.5 border ${
                          isSelected
                            ? "border-brand-600"
                            : "border-transparent"
                        }`}
                        style={{
                          backgroundColor: isSelected
                            ? roleStyle.bg
                            : "#F3F4F6",
                        }}
                        onPress={() => setFormRole(role)}
                        activeOpacity={0.7}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{
                            color: isSelected ? roleStyle.text : "#6B7280",
                          }}
                        >
                          {role}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Name */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1.5">
                  Name *
                </Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
                  placeholder="Full name"
                  placeholderTextColor="#9CA3AF"
                  value={formName}
                  onChangeText={setFormName}
                  autoCapitalize="words"
                />
              </View>

              {/* Email */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1.5">
                  Email *
                </Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
                  placeholder="email@example.com"
                  placeholderTextColor="#9CA3AF"
                  value={formEmail}
                  onChangeText={setFormEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Phone */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1.5">
                  Phone
                </Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
                  placeholder="(555) 123-4567"
                  placeholderTextColor="#9CA3AF"
                  value={formPhone}
                  onChangeText={setFormPhone}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Company */}
              <View className="mb-8">
                <Text className="text-sm font-medium text-gray-700 mb-1.5">
                  Company
                </Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
                  placeholder="Company name"
                  placeholderTextColor="#9CA3AF"
                  value={formCompany}
                  onChangeText={setFormCompany}
                  autoCapitalize="words"
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
