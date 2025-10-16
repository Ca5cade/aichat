type ChatMessageProps = {
  message: {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: number
  }
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
          isUser ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
        }`}
      >
        {isUser ? "You" : "AI"}
      </div>
      <div className={`flex-1 rounded-lg p-4 ${isUser ? "bg-accent text-accent-foreground" : "bg-muted"}`}>
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </div>
    </div>
  )
}
