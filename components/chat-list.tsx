"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Edit2, Check, X } from "lucide-react"
import type { Chat } from "@/app/page"

type ChatListProps = {
  chats: Chat[]
  currentChatId: string | null
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  onRenameChat: (chatId: string, title: string) => void
}

export function ChatList({ chats, currentChatId, onSelectChat, onDeleteChat, onRenameChat }: ChatListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  const startEditing = (chat: Chat) => {
    setEditingId(chat.id)
    setEditTitle(chat.title)
  }

  const saveEdit = (chatId: string) => {
    if (editTitle.trim()) {
      onRenameChat(chatId, editTitle.trim())
    }
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle("")
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-2">
      {chats.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No chats yet</p>
      ) : (
        chats.map((chat) => (
          <div
            key={chat.id}
            className={`group rounded-lg p-3 cursor-pointer transition-colors ${
              currentChatId === chat.id ? "bg-accent" : "hover:bg-accent/50"
            }`}
          >
            {editingId === chat.id ? (
              <div className="flex items-center gap-1">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(chat.id)
                    if (e.key === "Escape") cancelEdit()
                  }}
                  className="h-7 text-sm"
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit(chat.id)}>
                  <Check className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <>
                <div onClick={() => onSelectChat(chat.id)} className="flex-1">
                  <p className="text-sm font-medium truncate mb-1">{chat.title}</p>
                  <p className="text-xs text-muted-foreground">{chat.messages.length} messages</p>
                </div>
                <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation()
                      startEditing(chat)
                    }}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm("Delete this chat?")) {
                        onDeleteChat(chat.id)
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  )
}
