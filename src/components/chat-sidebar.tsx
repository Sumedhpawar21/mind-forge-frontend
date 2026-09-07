import {
  LogOut,
  MessageSquare,
  MessageSquarePlus,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Trash2,
  X,
} from "lucide-react"
import { useState } from "react"

import { APP_NAME } from "@/lib/brand"
import { Button } from "@/components/ui/button"
import { LogoutConfirmDialog } from "@/components/logout-confirm-dialog"
import { PlansDialog } from "@/components/plans-dialog"
import { useAuth } from "@/context/auth-context"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import type { Chat } from "@/types"

interface ChatSidebarProps {
  chats: Chat[]
  activeChatId: string | null
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
  onDeleteChat: (chatId: string) => void
  isLoading?: boolean
  mobileOpen?: boolean
  onMobileClose?: () => void
}

function getChatTitle(chat: Chat) {
  if (chat.title) return chat.title
  return "New chat"
}

export function ChatSidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isLoading,
  mobileOpen = false,
  onMobileClose,
}: ChatSidebarProps) {
  const { user, subscription, messagesRemaining, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [showPlansDialog, setShowPlansDialog] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      setShowLogoutDialog(false)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const resolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme

  const planName = subscription?.plan.name
  const isMobileExpanded = mobileOpen
  const showLabels = isMobileExpanded || !collapsed

  const handleSelectChat = (chatId: string) => {
    onSelectChat(chatId)
    onMobileClose?.()
  }

  const handleNewChat = () => {
    onNewChat()
    onMobileClose?.()
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-foreground/25 backdrop-blur-[1px] md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200",
          "fixed inset-y-0 left-0 z-50 w-[min(18rem,88vw)] md:relative md:z-auto md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          !isMobileExpanded && (collapsed ? "md:w-[4.5rem]" : "md:w-[17.5rem]")
        )}
      >
        <div className="flex items-center gap-2 p-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              if (isMobileExpanded) {
                onMobileClose?.()
                return
              }
              setCollapsed(!collapsed)
            }}
            aria-label={
              isMobileExpanded
                ? "Close sidebar"
                : collapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
            }
            className="shrink-0 text-muted-foreground"
          >
            {isMobileExpanded ? (
              <X className="size-4" />
            ) : collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>
          {showLabels && (
            <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
          )}
        </div>

        <div className="px-3 pb-2">
          <Button
            onClick={handleNewChat}
            className={cn(
              "w-full justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90",
              !showLabels && "size-11 justify-center px-0"
            )}
          >
            <MessageSquarePlus className="size-4 shrink-0" />
            {showLabels && <span>New chat</span>}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-1" aria-label="Chat history">
          {showLabels && (
            <p className="px-2 pb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Recent
            </p>
          )}

          {isLoading ? (
            <div className="space-y-1 px-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-11 animate-pulse rounded-lg bg-sidebar-accent"
                />
              ))}
            </div>
          ) : chats.length === 0 ? (
            showLabels && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No chats yet
              </p>
            )
          ) : (
            <ul className="space-y-0.5">
              {chats.map((chat) => {
                const isActive = activeChatId === chat.id
                return (
                  <li key={chat.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => handleSelectChat(chat.id)}
                      title={getChatTitle(chat)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-accent font-medium text-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground"
                      )}
                    >
                      <MessageSquare className="size-4 shrink-0 opacity-60" />
                      {showLabels && (
                        <span className="truncate pr-8">{getChatTitle(chat)}</span>
                      )}
                    </button>
                    {showLabels && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Delete chat"
                        className="absolute top-1/2 right-1 -translate-y-1/2 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteChat(chat.id)
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </nav>

        <div className="border-t border-sidebar-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div
            className={cn(
              "flex items-center",
              !showLabels ? "flex-col gap-2" : "justify-between gap-2"
            )}
          >
            {showLabels && user && (
              <button
                type="button"
                onClick={() => setShowPlansDialog(true)}
                className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1 text-left transition-colors hover:bg-sidebar-accent/70"
                title="View plans & subscription"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="size-9 rounded-full ring-1 ring-border"
                  />
                ) : (
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                  {planName && (
                    <p className="mt-0.5 truncate text-[11px] font-medium text-primary">
                      {planName} plan
                      {subscription ? ` · ${messagesRemaining} left` : ""}
                    </p>
                  )}
                </div>
              </button>
            )}
            <div className="flex items-center gap-0.5">
              {!showLabels && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowPlansDialog(true)}
                  aria-label="Plans & subscription"
                  title={planName ? `${planName} plan` : "Plans"}
                >
                  <span className="text-[10px] font-bold text-primary">
                    {planName?.charAt(0) ?? "P"}
                  </span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
                aria-label="Toggle theme"
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowLogoutDialog(true)}
                aria-label="Log out"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <LogoutConfirmDialog
          open={showLogoutDialog}
          isLoading={isLoggingOut}
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutDialog(false)}
        />

        <PlansDialog
          open={showPlansDialog}
          onClose={() => setShowPlansDialog(false)}
        />
      </aside>
    </>
  )
}
