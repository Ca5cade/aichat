"use client"

import { useState, useEffect, useCallback } from "react"
import { ChatInterface } from "@/components/chat-interface"
import { ChatList } from "@/components/chat-list"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

export type Chat = {
  id: string
  title: string
  messages: Array<{
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: number
  }>
  createdAt: number
  updatedAt: number
}

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Load chats from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem("ai-roleplay-chats")
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats)
      setChats(parsedChats)
      if (parsedChats.length > 0 && !currentChatId) {
        setCurrentChatId(parsedChats[0].id)
      }
    }
  }, [currentChatId])

  // Save chats to localStorage whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem("ai-roleplay-chats", JSON.stringify(chats))
    }
  }, [chats])

  const createNewChat = () => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title: "New Roleplay",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setChats([newChat, ...chats])
    setCurrentChatId(newChat.id)
  }

  const deleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/chat?sessionId=${chatId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat history');
      }

      const updatedChats = chats.filter((chat) => chat.id !== chatId)
      setChats(updatedChats)
      if (currentChatId === chatId) {
        setCurrentChatId(updatedChats.length > 0 ? updatedChats[0].id : null)
      }
      if (updatedChats.length === 0) {
        localStorage.removeItem("ai-roleplay-chats")
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  }

  const updateChat = useCallback((chatId: string, updates: Partial<Chat>) => {
    setChats(chats => chats.map((chat) => (chat.id === chatId ? { ...chat, ...updates, updatedAt: Date.now() } : chat)))
  }, []);

  const handleUpdateChat = useCallback((updates: Partial<Chat>) => {
    if (currentChatId) {
      updateChat(currentChatId, updates);
    }
  }, [currentChatId, updateChat]);

  const currentChat = chats.find((chat) => chat.id === currentChatId)

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`${isSidebarOpen ? "w-64" : "w-0"} transition-all duration-300 border-r border-border overflow-hidden`}
      >
        <div className="flex flex-col h-full p-4">
          <Button onClick={createNewChat} className="w-full mb-4 gap-2">
            <PlusCircle className="w-4 h-4" />
            New Chat
          </Button>
          <ChatList
            chats={chats}
            currentChatId={currentChatId}
            onSelectChat={setCurrentChatId}
            onDeleteChat={deleteChat}
            onRenameChat={(chatId, title) => updateChat(chatId, { title })}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentChat ? (
          <ChatInterface
            chat={currentChat}
            onUpdateChat={handleUpdateChat}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isSidebarOpen={isSidebarOpen}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4 text-balance">AI Roleplay Chat</h1>
              <p className="text-muted-foreground mb-8 text-pretty">
                Start a new conversation to begin your roleplay adventure
              </p>
              <Button onClick={createNewChat} size="lg" className="gap-2">
                <PlusCircle className="w-5 h-5" />
                Create Your First Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}