import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "@/services/api";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string | null;
  context: { propertyId?: string } | null;
  updatedAt: string;
  messages: { content: string; role: string }[];
}

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
}

function MessageBubble({ message }: { message: Message }) {
  const isAI = message.sender === "ai";

  return (
    <View
      className={`flex-row mb-4 ${isAI ? "justify-start" : "justify-end"}`}
    >
      {isAI && (
        <View className="w-8 h-8 bg-brand-600 rounded-full items-center justify-center mr-2 mt-1">
          <Ionicons name="sparkles" size={16} color="#FFFFFF" />
        </View>
      )}
      <View
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isAI
            ? "bg-white border border-gray-100"
            : "bg-brand-600"
        }`}
        style={
          isAI
            ? {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 4,
                elevation: 1,
              }
            : {}
        }
      >
        <Text
          className={`text-sm leading-5 ${
            isAI ? "text-gray-800" : "text-white"
          }`}
        >
          {message.text}
        </Text>
        <Text
          className={`text-[10px] mt-1.5 ${
            isAI ? "text-gray-400" : "text-blue-200"
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showConvoList, setShowConvoList] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // Fetch conversations on mount
  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get("/chat/conversations");
      setConversations(res.data?.data ?? []);
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProperties = useCallback(async () => {
    try {
      const res = await api.get("/properties");
      setProperties(res.data?.data?.properties ?? []);
    } catch {
      // Silently handle
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchProperties();
  }, [fetchConversations, fetchProperties]);

  // Load messages for active conversation
  const loadMessages = useCallback(async (convoId: string) => {
    try {
      const res = await api.get(`/chat/conversations/${convoId}`);
      const dbMessages = res.data?.data?.messages ?? [];
      setMessages(
        dbMessages.map((m: { id: string; role: string; content: string; createdAt: string }) => ({
          id: m.id,
          text: m.content,
          sender: m.role === "user" ? "user" : "ai",
          timestamp: new Date(m.createdAt),
        }))
      );
    } catch {
      // Silently handle
    }
  }, []);

  useEffect(() => {
    if (activeConvoId) {
      loadMessages(activeConvoId);
    }
  }, [activeConvoId, loadMessages]);

  // Create new conversation
  const createConversation = async (propertyId?: string) => {
    try {
      const res = await api.post("/chat/conversations", {
        title: propertyId ? "Property Chat" : "General Chat",
        propertyId,
      });
      const newConvo = res.data?.data;
      if (newConvo) {
        setConversations((prev) => [{ ...newConvo, messages: [] }, ...prev]);
        setActiveConvoId(newConvo.id);
        setMessages([]);
      }
    } catch {
      // Silently handle
    } finally {
      setShowNewChat(false);
    }
  };

  // Send message
  const handleSend = async () => {
    if (!inputText.trim() || isTyping) return;

    // If no active conversation, create one first
    if (!activeConvoId) {
      try {
        const res = await api.post("/chat/conversations", {
          title: "General Chat",
        });
        const newConvo = res.data?.data;
        if (newConvo) {
          setConversations((prev) => [{ ...newConvo, messages: [] }, ...prev]);
          setActiveConvoId(newConvo.id);
          // Continue with sending message to this new convo
          await sendToConvo(newConvo.id, inputText.trim());
        }
      } catch {
        // Silently handle
      }
      return;
    }

    await sendToConvo(activeConvoId, inputText.trim());
  };

  const sendToConvo = async (convoId: string, text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    try {
      const res = await api.post(`/chat/conversations/${convoId}/messages`, {
        content: text,
      });

      // The response is streamed text — collect it
      const responseText = typeof res.data === "string" ? res.data : (res.data?.text || res.data?.data || "I'm sorry, I couldn't process your request.");

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: unknown) {
      const error = err as { response?: { status: number } };
      const errorText =
        error?.response?.status === 402
          ? "You've run out of AI credits. Please upgrade your plan to continue."
          : "Sorry, I couldn't get a response. Please try again.";

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const activeConvo = conversations.find((c) => c.id === activeConvoId);
  const isPropertyChat = !!activeConvo?.context?.propertyId;

  const suggestedQuestions = isPropertyChat
    ? [
        "What permits do I have?",
        "What inspections are coming up?",
        "What do I need to do next?",
      ]
    : [
        "What permits do I need for a kitchen renovation?",
        "How long does permit approval take?",
        "What documents are required?",
      ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-100 flex-row items-center">
        <TouchableOpacity
          onPress={() => setShowConvoList(true)}
          className="mr-3"
        >
          <Ionicons name="menu" size={24} color="#111827" />
        </TouchableOpacity>
        <View className="w-8 h-8 bg-brand-600 rounded-full items-center justify-center mr-3">
          <Ionicons name="sparkles" size={16} color="#FFFFFF" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900">
            {activeConvo?.title || "AI Assistant"}
          </Text>
          <Text className="text-xs text-green-500 font-medium">
            {isPropertyChat ? "Property context" : "Online"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowNewChat(true)}>
          <Ionicons name="add-circle-outline" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 8, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-4">
                <Ionicons name="sparkles" size={32} color="#2563EB" />
              </View>
              <Text className="text-lg font-bold text-gray-900 mb-1">
                Permits on the Go AI
              </Text>
              <Text className="text-sm text-gray-500 text-center px-8">
                Ask me anything about permits, building codes, or how to use the app.
              </Text>
            </View>
          }
          ListFooterComponent={
            <>
              {isTyping && (
                <View className="flex-row items-center mb-4">
                  <View className="w-8 h-8 bg-brand-600 rounded-full items-center justify-center mr-2">
                    <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                  </View>
                  <View className="bg-white border border-gray-100 rounded-2xl px-4 py-3">
                    <ActivityIndicator size="small" color="#2563EB" />
                  </View>
                </View>
              )}
              {messages.length === 0 && (
                <View className="mt-4">
                  <Text className="text-xs text-gray-400 mb-2 font-medium">
                    SUGGESTED QUESTIONS
                  </Text>
                  {suggestedQuestions.map((question, index) => (
                    <TouchableOpacity
                      key={index}
                      className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-2"
                      onPress={() => {
                        setInputText(question);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text className="text-sm text-brand-600">
                        {question}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          }
        />

        {/* Input Bar */}
        <View className="px-4 py-3 bg-white border-t border-gray-100">
          <View className="flex-row items-end bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2">
            <TextInput
              className="flex-1 text-sm text-gray-900 max-h-24 py-1.5"
              placeholder="Ask about permits, codes, regulations..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              textAlignVertical="center"
              editable={!isTyping}
            />
            <TouchableOpacity
              className={`ml-2 w-9 h-9 rounded-full items-center justify-center ${
                inputText.trim() && !isTyping ? "bg-brand-600" : "bg-gray-200"
              }`}
              onPress={handleSend}
              disabled={!inputText.trim() || isTyping}
              activeOpacity={0.7}
            >
              <Ionicons
                name="send"
                size={16}
                color={inputText.trim() && !isTyping ? "#FFFFFF" : "#9CA3AF"}
              />
            </TouchableOpacity>
          </View>
          <Text className="text-[10px] text-gray-400 text-center mt-2">
            AI responses are for guidance only. Always verify with local
            authorities.
          </Text>
        </View>
      </KeyboardAvoidingView>

      {/* Conversation List Modal */}
      <Modal
        visible={showConvoList}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-900 flex-1">
              Conversations
            </Text>
            <TouchableOpacity onPress={() => setShowConvoList(false)}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 p-4">
            {loading ? (
              <ActivityIndicator size="large" color="#2563EB" className="mt-10" />
            ) : conversations.length === 0 ? (
              <View className="items-center py-16">
                <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
                <Text className="mt-3 text-sm text-gray-500">
                  No conversations yet.
                </Text>
              </View>
            ) : (
              conversations.map((convo) => (
                <TouchableOpacity
                  key={convo.id}
                  onPress={() => {
                    setActiveConvoId(convo.id);
                    setShowConvoList(false);
                  }}
                  className={`bg-white rounded-xl p-4 mb-2 border ${
                    activeConvoId === convo.id
                      ? "border-blue-500"
                      : "border-gray-200"
                  }`}
                >
                  <Text className="text-sm font-semibold text-gray-900">
                    {convo.title || "Chat"}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                    {convo.messages?.[0]?.content || "No messages yet"}
                  </Text>
                  <Text className="text-[10px] text-gray-400 mt-1">
                    {new Date(convo.updatedAt).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* New Chat Modal */}
      <Modal
        visible={showNewChat}
        animationType="fade"
        transparent
      >
        <View className="flex-1 bg-black/30 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              New Chat
            </Text>

            <TouchableOpacity
              onPress={() => createConversation()}
              className="border border-gray-200 rounded-xl p-4 mb-3"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3">
                  <Ionicons name="sparkles" size={20} color="#2563EB" />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-gray-900">
                    General Chat
                  </Text>
                  <Text className="text-xs text-gray-500">
                    Permit process & app help
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {properties.length > 0 && (
              <>
                <Text className="text-xs text-gray-400 font-medium mb-2 mt-2">
                  OR SELECT A PROPERTY
                </Text>
                <ScrollView style={{ maxHeight: 200 }}>
                  {properties.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => createConversation(p.id)}
                      className="border border-gray-200 rounded-xl p-3 mb-2"
                    >
                      <Text className="text-sm font-medium text-gray-900">
                        {p.name}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {p.address}, {p.city}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <TouchableOpacity
              onPress={() => setShowNewChat(false)}
              className="mt-4 items-center"
            >
              <Text className="text-sm text-gray-500">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
