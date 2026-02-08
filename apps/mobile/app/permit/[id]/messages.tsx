import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import api from "@/services/api";
import { useAuthStore } from "@/stores/auth";

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return (
      "Yesterday " +
      date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    );
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MessagesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await api.get(`/permits/${id}/messages`);
      const data = response.data?.messages ?? response.data ?? [];
      setMessages(data);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const response = await api.post(`/permits/${id}/messages`, {
        content: trimmed,
      });

      const newMessage: Message = response.data ?? {
        id: Date.now().toString(),
        content: trimmed,
        senderId: user?.id ?? "",
        senderName: user?.name ?? "You",
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newMessage]);
      setContent("");

      // Auto-scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const isMyMessage = (msg: Message) => msg.senderId === user?.id;

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const mine = isMyMessage(item);
    const showSenderName =
      !mine &&
      (index === 0 || messages[index - 1]?.senderId !== item.senderId);

    return (
      <View
        className={`px-4 mb-2 ${mine ? "items-end" : "items-start"}`}
      >
        {showSenderName && (
          <Text className="text-xs text-gray-500 mb-1 ml-1">
            {item.senderName}
          </Text>
        )}
        <View
          className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
            mine ? "rounded-br-sm" : "rounded-bl-sm"
          }`}
          style={{
            backgroundColor: mine ? "#2563EB" : "#F3F4F6",
          }}
        >
          <Text
            className={`text-sm ${mine ? "text-white" : "text-gray-900"}`}
          >
            {item.content}
          </Text>
          <Text
            className={`text-[10px] mt-1 ${
              mine ? "text-blue-200" : "text-gray-400"
            }`}
          >
            {formatMessageTime(item.createdAt)}
          </Text>
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
        <Text className="text-sm text-gray-400 mt-3">
          Loading messages...
        </Text>
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
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900">Messages</Text>
          <Text className="text-xs text-gray-500">
            {messages.length} message{messages.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: 8,
            flexGrow: 1,
          }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          onLayout={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons
                name="chatbubbles-outline"
                size={48}
                color="#D1D5DB"
              />
              <Text className="text-base text-gray-400 mt-4">
                No messages yet
              </Text>
              <Text className="text-sm text-gray-400 mt-1">
                Start the conversation
              </Text>
            </View>
          }
        />

        {/* Input Bar */}
        <View className="flex-row items-end px-4 py-3 bg-white border-t border-gray-100">
          <TextInput
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-900 mr-2"
            style={{ maxHeight: 100 }}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            className={`w-10 h-10 rounded-full items-center justify-center ${
              content.trim() && !sending ? "bg-brand-600" : "bg-gray-200"
            }`}
            onPress={handleSend}
            disabled={!content.trim() || sending}
            activeOpacity={0.7}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons
                name="send"
                size={18}
                color={content.trim() ? "#FFFFFF" : "#9CA3AF"}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
