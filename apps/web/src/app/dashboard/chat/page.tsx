"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { Button } from "@/components/ui/button";

interface Conversation {
  id: string;
  title: string | null;
  context: { propertyId?: string } | null;
  updatedAt: string;
  messages: { content: string; role: string; createdAt: string }[];
  _count: { messages: number };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      if (!res.ok) return;
      const json = await res.json();
      setConversations(json.data ?? []);
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch properties for new chat picker
  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch("/api/properties");
      if (!res.ok) return;
      const json = await res.json();
      setProperties(json.data?.properties ?? []);
    } catch {
      // Silently handle
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchProperties();
  }, [fetchConversations, fetchProperties]);

  // Load messages when conversation changes
  const loadMessages = useCallback(async (convoId: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${convoId}`);
      if (!res.ok) return;
      const json = await res.json();
      setMessages(json.data?.messages ?? []);
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
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: propertyId ? "Property Chat" : "General Chat",
          propertyId,
        }),
      });
      if (!res.ok) return;
      const json = await res.json();
      const newConvo = json.data;
      setConversations((prev) => [{ ...newConvo, messages: [], _count: { messages: 0 } }, ...prev]);
      setActiveConvoId(newConvo.id);
      setMessages([]);
      setShowNewChat(false);
    } catch {
      // Silently handle
    }
  };

  // Delete conversation
  const deleteConversation = async (convoId: string) => {
    try {
      await fetch(`/api/chat/conversations/${convoId}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== convoId));
      if (activeConvoId === convoId) {
        setActiveConvoId(null);
        setMessages([]);
      }
    } catch {
      // Silently handle
    }
  };

  // Send message with streaming
  const sendMessage = async (content: string) => {
    if (!activeConvoId || sending) return;

    setSending(true);
    setStreamingContent("");

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(
        `/api/chat/conversations/${activeConvoId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );

      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        if (res.status === 402) {
          setStreamingContent("You've run out of AI credits. Please upgrade your plan to continue chatting.");
        } else {
          setStreamingContent(errorJson?.error || "Failed to get response. Please try again.");
        }
        setSending(false);
        return;
      }

      // Read streaming response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setStreamingContent(fullText);
        }
      }

      // Replace streaming content with final message
      setStreamingContent("");
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: fullText,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Refresh conversation list for latest preview
      fetchConversations();
    } catch {
      setStreamingContent("Connection error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const activeConvo = conversations.find((c) => c.id === activeConvoId);
  const isPropertyChat = !!activeConvo?.context?.propertyId;

  const generalSuggestions = [
    "How do I apply for a building permit?",
    "What subcodes do I need for a kitchen renovation?",
    "How do I schedule an inspection?",
    "What documents do I need for a permit?",
  ];

  const propertySuggestions = [
    "What permits do I have?",
    "What's the status of my permits?",
    "What inspections are coming up?",
    "What do I need to do next?",
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <div
        className={`flex-shrink-0 border-r border-neutral-200 bg-neutral-50 transition-all ${
          sidebarOpen ? "w-72" : "w-0 overflow-hidden"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-neutral-200 p-4">
            <Button className="w-full" onClick={() => setShowNewChat(true)}>
              + New Chat
            </Button>
          </div>

          {/* New Chat Picker */}
          {showNewChat && (
            <div className="border-b border-neutral-200 bg-white p-3 space-y-2">
              <p className="text-xs font-medium text-neutral-500 uppercase">
                Choose chat type
              </p>
              <button
                onClick={() => createConversation()}
                className="w-full rounded-lg border border-neutral-200 p-3 text-left text-sm hover:bg-neutral-50"
              >
                <span className="font-medium">General Chat</span>
                <br />
                <span className="text-xs text-neutral-400">
                  Permit process & app help
                </span>
              </button>
              {properties.length > 0 && (
                <>
                  <p className="text-xs text-neutral-400">Or select a property:</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {properties.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => createConversation(p.id)}
                        className="w-full rounded-lg border border-neutral-200 p-2 text-left text-xs hover:bg-neutral-50"
                      >
                        <span className="font-medium">{p.name}</span>
                        <br />
                        <span className="text-neutral-400">
                          {p.address}, {p.city}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              <button
                onClick={() => setShowNewChat(false)}
                className="text-xs text-neutral-400 hover:text-neutral-600"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-neutral-200" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-neutral-400">
                No conversations yet.
                <br />
                Start a new chat!
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {conversations.map((convo) => (
                  <div
                    key={convo.id}
                    className={`group flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                      activeConvoId === convo.id
                        ? "bg-primary-50 border border-primary-200"
                        : "hover:bg-neutral-100"
                    }`}
                    onClick={() => setActiveConvoId(convo.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {convo.title || "Chat"}
                      </p>
                      <p className="truncate text-xs text-neutral-400">
                        {convo.messages[0]?.content || "No messages"}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(convo.id);
                      }}
                      className="ml-2 hidden text-neutral-300 hover:text-red-500 group-hover:block"
                      title="Delete"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Chat Header */}
        <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              {activeConvo?.title || "AI Chat Assistant"}
            </h2>
            {isPropertyChat && (
              <span className="text-xs text-primary-600">
                Property-specific context
              </span>
            )}
          </div>
        </div>

        {/* Messages */}
        {activeConvoId ? (
          <>
            <ChatMessages
              messages={messages}
              streamingContent={streamingContent || undefined}
            />
            <ChatInput
              onSend={sendMessage}
              disabled={sending}
              suggestions={
                messages.length === 0
                  ? isPropertyChat
                    ? propertySuggestions
                    : generalSuggestions
                  : []
              }
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-50">
                <svg className="h-10 w-10 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-neutral-900">
                Permits on the Go AI
              </h2>
              <p className="mt-2 max-w-sm text-sm text-neutral-500">
                Your AI assistant for permits, building codes, and construction
                regulations. Start a new chat to get help.
              </p>
              <Button className="mt-4" onClick={() => setShowNewChat(true)}>
                Start a New Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
