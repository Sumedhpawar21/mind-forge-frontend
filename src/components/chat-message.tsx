import ReactMarkdown from "react-markdown"
import { Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import type { MessageRole } from "@/types"

interface ChatMessageProps {
  role: MessageRole
  content: string
  isStreaming?: boolean
}

function TypingIndicator() {
  return (
    <span className="inline-flex items-center gap-1.5 py-1">
      <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/50" />
      <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
      <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
    </span>
  )
}

function AssistantAvatar() {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
      AI
    </div>
  )
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === "User"

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-3 sm:px-8">
        <div
          className={cn(
            "max-w-[min(85%,36rem)] rounded-[1.125rem] rounded-br-sm px-4 py-3 text-[0.9375rem] leading-relaxed",
            "bg-user-bubble text-user-bubble-foreground"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex gap-4 px-4 py-3 sm:px-8">
      <AssistantAvatar />

      <div className="min-w-0 flex-1 pt-0.5">
        {content ? (
          <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none break-words text-[0.9375rem] leading-relaxed text-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-4 [&_ul]:my-2">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : isStreaming ? (
          <TypingIndicator />
        ) : null}

        {isStreaming && content && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3 text-primary" />
            Writing...
          </p>
        )}
      </div>
    </div>
  )
}
