"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Menu, Send } from "lucide-react";
import type { Chat } from "@/app/page";
import { ChatMessage } from "./chat-message";

type ChatInterfaceProps = {
  chat: Chat;
  onUpdateChat: (updates: Partial<Chat>) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
};

export function ChatInterface({ chat, onUpdateChat, onToggleSidebar, isSidebarOpen }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sessionIdRef = useRef<string>(chat.id);

  useEffect(() => {
    sessionIdRef.current = chat.id;
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat?sessionId=${sessionIdRef.current}`);
        if (!response.ok) {
          throw new Error("Failed to fetch chat history");
        }
        const data = await response.json();
        if (data.messages) {
          onUpdateChat({ messages: data.messages });
        }
      } catch (error) {
        console.error("Error fetching chat history:", error);
      } finally {
        setIsHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [chat.id, onUpdateChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = {
      role: "user" as const,
      content: input.trim(),
    }

    const updatedMessages = [...chat.messages, userMessage]
    onUpdateChat({ messages: updatedMessages })
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, sessionId: sessionIdRef.current }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()

      const assistantMessage = {
        role: "assistant" as const,
        content: data.message,
      }

      onUpdateChat({
        messages: [...updatedMessages, assistantMessage],
        title: chat.messages.length === 0 ? input.slice(0, 50) : chat.title,
      })
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center gap-3">
        {!isSidebarOpen && (
          <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
            <Menu className="w-5 h-5" />
          </Button>
        )}
        <h2 className="text-lg font-semibold truncate">{chat.title}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isHistoryLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p className="text-lg mb-2">Loading chat history...</p>
            </div>
          </div>
        ) : chat.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p className="text-lg mb-2">Start your roleplay adventure</p>
              <p className="text-sm">Type a message to begin...</p>
            </div>
          </div>
        ) : (
          chat.messages.map((message, index) => <ChatMessage key={index} message={message} />)
        )}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
              AI
            </div>
            <div className="flex-1 bg-muted rounded-lg p-4">
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="min-h-[60px] max-h-[200px] resize-none"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-[60px] w-[60px]">
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}