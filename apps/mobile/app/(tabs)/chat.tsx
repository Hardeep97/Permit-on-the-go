import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    text: "Hello! I'm your AI permit assistant. I can help you with:\n\n- Understanding permit requirements\n- Answering questions about building codes\n- Guiding you through the application process\n- Explaining inspection requirements\n\nHow can I help you today?",
    sender: "ai",
    timestamp: new Date(),
  },
];

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
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Thank you for your question! I'm currently in demo mode. Once connected to the backend, I'll be able to provide detailed answers about permits, building codes, and regulations specific to your jurisdiction.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const suggestedQuestions = [
    "What permits do I need for a kitchen renovation?",
    "How long does permit approval take?",
    "What documents are required?",
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-100 flex-row items-center">
        <View className="w-10 h-10 bg-brand-600 rounded-full items-center justify-center mr-3">
          <Ionicons name="sparkles" size={20} color="#FFFFFF" />
        </View>
        <View>
          <Text className="text-lg font-bold text-gray-900">AI Assistant</Text>
          <Text className="text-xs text-green-500 font-medium">Online</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListFooterComponent={
            <>
              {isTyping && (
                <View className="flex-row items-center mb-4">
                  <View className="w-8 h-8 bg-brand-600 rounded-full items-center justify-center mr-2">
                    <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                  </View>
                  <View className="bg-white border border-gray-100 rounded-2xl px-4 py-3">
                    <Text className="text-sm text-gray-400">Typing...</Text>
                  </View>
                </View>
              )}
              {messages.length === 1 && (
                <View className="mt-2">
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
            />
            <TouchableOpacity
              className={`ml-2 w-9 h-9 rounded-full items-center justify-center ${
                inputText.trim() ? "bg-brand-600" : "bg-gray-200"
              }`}
              onPress={handleSend}
              disabled={!inputText.trim()}
              activeOpacity={0.7}
            >
              <Ionicons
                name="send"
                size={16}
                color={inputText.trim() ? "#FFFFFF" : "#9CA3AF"}
              />
            </TouchableOpacity>
          </View>
          <Text className="text-[10px] text-gray-400 text-center mt-2">
            AI responses are for guidance only. Always verify with local
            authorities.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
