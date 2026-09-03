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
}

export function ChatInput({
  onSend,
  disabled,
  isLoading,
  placeholder = `Message ${APP_NAME}...`,
}: ChatInputProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled || isLoading) return
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
    <div className="shrink-0 border-t border-border bg-chat-surface px-4 py-4 sm:px-8">
      <div className="mx-auto max-w-3xl">
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
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
            aria-label="Message input"
            className="max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-base leading-relaxed outline-none placeholder:text-muted-foreground disabled:opacity-50 sm:text-[0.9375rem]"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!value.trim() || disabled || isLoading}
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
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  )
}
