"use client";

import { useEffect, useRef } from "react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  streamingContent?: string;
}

function formatMarkdown(text: string): string {
  // Simple markdown: bold, italic, code, headers, lists
  return text
    .replace(/```([\s\S]*?)```/g, '<pre class="my-2 rounded bg-neutral-800 p-3 text-sm text-neutral-100 overflow-x-auto"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-neutral-200 px-1.5 py-0.5 text-sm">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, '<h3 class="mt-3 mb-1 text-sm font-semibold">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="mt-3 mb-1 text-base font-semibold">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="mt-3 mb-1 text-lg font-bold">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm">$1</li>')
    .replace(/\n/g, "<br />");
}

export function ChatMessages({ messages, streamingContent }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  if (messages.length === 0 && !streamingContent) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
            <svg className="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900">
            Start a conversation
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            Ask me anything about permits, building codes, or how to use the app.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === "user"
                ? "bg-primary-600 text-white"
                : "bg-neutral-100 text-neutral-900"
            }`}
          >
            {msg.role === "assistant" ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            )}
            <p
              className={`mt-1 text-xs ${
                msg.role === "user" ? "text-primary-200" : "text-neutral-400"
              }`}
            >
              {new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      ))}

      {/* Streaming response */}
      {streamingContent && (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-2xl bg-neutral-100 px-4 py-3 text-neutral-900">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(streamingContent) }}
            />
            <span className="inline-block h-4 w-1 animate-pulse bg-primary-500" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
