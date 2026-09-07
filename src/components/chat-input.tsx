import { ArrowUp, Loader2 } from "lucide-react"
import { useRef, useState, type KeyboardEvent } from "react"

import { Button } from "@/components/ui/button"
import { APP_NAME } from "@/lib/brand"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  isLoading?: boolean
  placeholder?: string
  messagesUsed?: number
  messagesLimit?: number
  messagesRemaining?: number
  isLimitReached?: boolean
  onUpgradeClick?: () => void
}

function MessageLimitRing({
  used,
  limit,
  onClick,
}: {
  used: number
  limit: number
  onClick?: () => void
}) {
  const safeLimit = Math.max(limit, 1)
  const ratio = Math.min(used / safeLimit, 1)
  const size = 28
  const stroke = 2.5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - ratio)
  const remaining = Math.max(limit - used, 0)
  const isNearLimit = ratio >= 0.8
  const isAtLimit = used >= limit && limit > 0

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${used} of ${limit} messages used`}
      aria-label={`${used} of ${limit} messages used${onClick ? ". Open plans" : ""}`}
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
        onClick && "hover:bg-muted",
        isAtLimit && "text-destructive",
        isNearLimit && !isAtLimit && "text-amber-600 dark:text-amber-400"
      )}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="opacity-15"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "transition-[stroke-dashoffset] duration-500",
            isAtLimit
              ? "text-destructive"
              : isNearLimit
                ? "text-amber-600 dark:text-amber-400"
                : "text-primary"
          )}
        />
      </svg>
      <span className="absolute text-[9px] font-semibold tabular-nums leading-none">
        {remaining}
      </span>
    </button>
  )
}

export function ChatInput({
  onSend,
  disabled,
  isLoading,
  placeholder = `Message ${APP_NAME}...`,
  messagesUsed,
  messagesLimit,
  messagesRemaining,
  isLimitReached: isLimitReachedProp,
  onUpgradeClick,
}: ChatInputProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const hasLimit =
    typeof messagesRemaining === "number" && messagesRemaining >= 0
  const isLimitReached =
    isLimitReachedProp ??
    (typeof messagesUsed === "number" &&
      typeof messagesLimit === "number" &&
      messagesLimit > 0 &&
      messagesUsed >= messagesLimit)

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled || isLoading || isLimitReached) return
    onSend(trimmed)
    setValue("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  return (
    <div className="shrink-0 border-t border-border bg-chat-surface px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-4">
      <div className="mx-auto max-w-3xl">
        {isLimitReached && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm">
            <p className="text-muted-foreground">
              Message limit reached for your plan.
            </p>
            {onUpgradeClick && (
              <Button size="sm" variant="outline" onClick={onUpgradeClick}>
                Upgrade
              </Button>
            )}
          </div>
        )}

        <div
          className={cn(
            "flex items-end gap-2 rounded-2xl border border-border bg-background p-2",
            "transition-colors focus-within:border-primary/50"
          )}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder={
              isLimitReached ? "Upgrade to send more messages..." : placeholder
            }
            disabled={disabled || isLoading || isLimitReached}
            rows={1}
            aria-label="Message input"
            className="max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-base leading-relaxed outline-none placeholder:text-muted-foreground disabled:opacity-50 sm:text-[0.9375rem]"
          />
          {hasLimit && (
            <MessageLimitRing
              used={Math.max(0, (messagesLimit ?? 0) - (messagesRemaining ?? 0))}
              limit={Math.max(messagesLimit ?? 1, messagesRemaining ?? 0)}
              onClick={onUpgradeClick}
            />
          )}
          <Button
            size="icon"
            onClick={handleSend}
            disabled={
              !value.trim() || disabled || isLoading || isLimitReached
            }
            aria-label="Send message"
            className="size-9 shrink-0 rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowUp className="size-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {hasLimit
            ? `${messagesRemaining} messages remaining · AI can make mistakes.`
            : "AI can make mistakes. Verify important information."}
        </p>
      </div>
    </div>
  )
}
