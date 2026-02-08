import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "@/services/api";

interface Party {
  id: string;
  role: string;
  user?: { id: string; name: string; email: string };
  contact?: { name: string; email: string };
}

interface PhotoShareModalProps {
  visible: boolean;
  onClose: () => void;
  photoId: string;
  permitId: string;
}

export default function PhotoShareModal({
  visible,
  onClose,
  photoId,
  permitId,
}: PhotoShareModalProps) {
  const [parties, setParties] = useState<Party[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchParties();
      setSelected(new Set());
      setMessage("");
    }
  }, [visible]);

  const fetchParties = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/permits/${permitId}/parties`);
      const data = response.data?.parties ?? response.data ?? [];
      setParties(data.filter((p: Party) => getEmail(p)));
    } catch {
      Alert.alert("Error", "Failed to load parties");
    } finally {
      setLoading(false);
    }
  };

  const getName = (party: Party): string =>
    party.user?.name || party.contact?.name || "Unknown";

  const getEmail = (party: Party): string =>
    party.user?.email || party.contact?.email || "";

  const toggleSelection = (partyId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(partyId)) {
        next.delete(partyId);
      } else {
        next.add(partyId);
      }
      return next;
    });
  };

  const handleSend = async () => {
    if (selected.size === 0) {
      Alert.alert("Select Recipients", "Please select at least one recipient.");
      return;
    }

    setSending(true);
    try {
      const recipients = parties
        .filter((p) => selected.has(p.id))
        .map((p) => ({
          email: getEmail(p),
          name: getName(p),
          message: message.trim() || undefined,
        }));

      await api.post(`/photos/${photoId}/share`, { recipients });
      Alert.alert("Shared", `Photo shared with ${recipients.length} recipient(s).`);
      onClose();
    } catch {
      Alert.alert("Error", "Failed to share photo.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl px-6 pb-10 pt-6 max-h-[80%]">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">Share Photo</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          ) : parties.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="people-outline" size={40} color="#D1D5DB" />
              <Text className="text-sm text-gray-400 mt-3">No parties with email addresses</Text>
            </View>
          ) : (
            <>
              <Text className="text-xs text-gray-500 mb-3">Select recipients:</Text>
              <FlatList
                data={parties}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 250 }}
                renderItem={({ item }) => {
                  const isSelected = selected.has(item.id);
                  return (
                    <TouchableOpacity
                      className={`flex-row items-center bg-gray-50 rounded-xl px-4 py-3 mb-2 ${
                        isSelected ? "border border-blue-500" : ""
                      }`}
                      onPress={() => toggleSelection(item.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        className={`w-5 h-5 rounded border mr-3 items-center justify-center ${
                          isSelected
                            ? "bg-blue-600 border-blue-600"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-gray-900">
                          {getName(item)}
                        </Text>
                        <Text className="text-xs text-gray-500">{getEmail(item)}</Text>
                      </View>
                      <View className="bg-gray-200 rounded-full px-2 py-0.5">
                        <Text className="text-[10px] font-semibold text-gray-600">
                          {item.role}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />

              {/* Optional message */}
              <View className="mt-3">
                <Text className="text-xs text-gray-500 mb-1.5">Message (optional):</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
                  placeholder="Add a note..."
                  placeholderTextColor="#9CA3AF"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Send button */}
              <TouchableOpacity
                className={`mt-4 rounded-xl py-3.5 items-center ${
                  selected.size > 0 ? "bg-blue-600" : "bg-gray-300"
                }`}
                onPress={handleSend}
                disabled={sending || selected.size === 0}
                activeOpacity={0.7}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-sm font-semibold">
                    Share with {selected.size} recipient{selected.size !== 1 ? "s" : ""}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
