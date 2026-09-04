import {
  Code2,
  Lightbulb,
  MapPin,
  PenLine,
  Sparkles,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { ChatInput } from "@/components/chat-input"
import { ChatMessage } from "@/components/chat-message"
import { ChatSidebar } from "@/components/chat-sidebar"
import { PlansDialog } from "@/components/plans-dialog"
import { useAuth } from "@/context/auth-context"
import { chatApi, messageApi } from "@/lib/api"
import type { Chat, Message } from "@/types"

interface ChatViewProps {
  chatId: string | null
  activeChatTitle: string | null
  onChatCreated: (chatId: string) => void
  onChatsRefresh: () => void
}

interface LocalMessage {
  id: string
  role: "User" | "AGENT"
  content: string
}

const suggestions = [
  {
    icon: Lightbulb,
    label: "Explain React hooks simply",
    text: "Explain React hooks in simple terms",
  },
  {
    icon: Code2,
    label: "Write a sorting function",
    text: "Write a Python function to sort a list",
  },
  {
    icon: MapPin,
    label: "Plan a weekend trip",
    text: "Help me plan a weekend trip",
  },
  {
    icon: PenLine,
    label: "Draft an email",
    text: "Help me write a professional follow-up email",
  },
]

export function ChatView({
  chatId,
  activeChatTitle,
  onChatCreated,
  onChatsRefresh,
}: ChatViewProps) {
  const {
    messagesUsed,
    messagesLimit,
    isLimitReached,
    refreshUsage,
  } = useAuth()
  const [messages, setMessages] = useState<LocalMessage[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [showPlansDialog, setShowPlansDialog] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    if (!chatId) {
      setMessages([])
      setStreamingContent("")
      setError(null)
      return
    }

    let cancelled = false

    const loadMessages = async () => {
      setIsLoadingMessages(true)
      setError(null)

      try {
        const res = await messageApi.list(chatId)
        if (cancelled) return

        const loaded = (res.data?.messages ?? [])
          .slice()
          .reverse()
          .map((m: Message) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          }))

        setMessages(loaded)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load messages"
          )
        }
      } finally {
        if (!cancelled) setIsLoadingMessages(false)
      }
    }

    loadMessages()
    return () => {
      cancelled = true
    }
  }, [chatId])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  const handleSend = async (text: string) => {
    if (isLimitReached) {
      setShowPlansDialog(true)
      setError("Message limit reached. Upgrade your plan to continue.")
      return
    }

    const userMsg: LocalMessage = {
      id: `temp-user-${Date.now()}`,
      role: "User",
      content: text,
    }

    setMessages((prev) => [...prev, userMsg])
    setIsSending(true)
    setStreamingContent("")
    setError(null)

    try {
      const { chatId: resolvedChatId, fullText } = await messageApi.send(
        text,
        chatId ?? undefined,
        (chunk) => {
          setStreamingContent((prev) => prev + chunk)
        }
      )

      const agentMsg: LocalMessage = {
        id: `temp-agent-${Date.now()}`,
        role: "AGENT",
        content: fullText,
      }

      setMessages((prev) => [...prev, agentMsg])
      setStreamingContent("")

      if (!chatId && resolvedChatId) {
        onChatCreated(resolvedChatId)
      }

      onChatsRefresh()
      void refreshUsage()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send message"
      setError(
        message.toLowerCase().includes("internal server error") ||
          message.toLowerCase().includes("max message limit")
          ? "Message limit reached or request failed. Try upgrading your plan."
          : message
      )
      setStreamingContent("")
      void refreshUsage()
    } finally {
      setIsSending(false)
    }
  }

  const showEmpty = !chatId && messages.length === 0 && !isSending

  return (
    <div className="flex h-full flex-1 flex-col bg-chat-surface">
      {activeChatTitle && (
        <header className="flex h-12 shrink-0 items-center justify-center border-b border-border px-4">
          <h1 className="truncate text-sm font-medium text-foreground">
            {activeChatTitle}
          </h1>
        </header>
      )}

      <div className="flex-1 overflow-y-auto">
        {showEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-10 px-4 py-16">
            <div className="max-w-lg space-y-3 text-center">
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="size-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                What can I help with?
              </h2>
              <p className="text-sm text-muted-foreground">
                Ask a question or choose a suggestion to get started.
              </p>
            </div>

            <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.text}
                  type="button"
                  onClick={() => handleSend(suggestion.text)}
                  disabled={isSending}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3.5 text-left text-sm transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <suggestion.icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-foreground/90">{suggestion.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : isLoadingMessages ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-muted-foreground" />
              Loading conversation...
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl py-4">
            <div className="divide-y divide-border/50">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                />
              ))}
              {isSending && streamingContent && (
                <ChatMessage
                  role="AGENT"
                  content={streamingContent}
                  isStreaming
                />
              )}
              {isSending && !streamingContent && (
                <ChatMessage role="AGENT" content="" isStreaming />
              )}
            </div>
            <div ref={bottomRef} className="h-6" />
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-3xl px-4 py-2">
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </p>
          </div>
        )}
      </div>

      <ChatInput
        onSend={handleSend}
        disabled={isLoadingMessages}
        isLoading={isSending}
        messagesUsed={messagesUsed}
        messagesLimit={messagesLimit}
        onUpgradeClick={() => setShowPlansDialog(true)}
      />

      <PlansDialog
        open={showPlansDialog}
        onClose={() => setShowPlansDialog(false)}
      />
    </div>
  )
}

interface ChatLayoutProps {
  activeChatId: string | null
  onSelectChat: (chatId: string | null) => void
}

function ChatLayoutContent({ activeChatId, onSelectChat }: ChatLayoutProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoadingChats, setIsLoadingChats] = useState(true)

  const loadChats = useCallback(async () => {
    try {
      const res = await chatApi.list()
      setChats(res.data?.chats ?? [])
    } catch {
      setChats([])
    } finally {
      setIsLoadingChats(false)
    }
  }, [])

  useEffect(() => {
    loadChats()
  }, [loadChats])

  const handleDeleteChat = async (chatId: string) => {
    try {
      await chatApi.delete(chatId)
      setChats((prev) => prev.filter((c) => c.id !== chatId))
      if (activeChatId === chatId) {
        onSelectChat(null)
      }
    } catch {
      // ignore
    }
  }

  const activeChat = chats.find((c) => c.id === activeChatId)
  const activeChatTitle = activeChat?.title || null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={(id: string) => onSelectChat(id)}
        onNewChat={() => onSelectChat(null)}
        onDeleteChat={handleDeleteChat}
        isLoading={isLoadingChats}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <ChatView
          chatId={activeChatId}
          activeChatTitle={activeChatTitle}
          onChatCreated={(id) => onSelectChat(id)}
          onChatsRefresh={loadChats}
        />
      </main>
    </div>
  )
}

export function ChatLayout() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const activeChatId = chatId ?? null

  const onSelectChat = useCallback(
    (id: string | null) => {
      if (id) {
        navigate(`/chat/${id}`)
      } else {
        navigate("/")
      }
    },
    [navigate]
  )

  return (
    <ChatLayoutContent activeChatId={activeChatId} onSelectChat={onSelectChat} />
  )
}
