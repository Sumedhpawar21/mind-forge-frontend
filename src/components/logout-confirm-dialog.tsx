import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { APP_NAME } from "@/lib/brand"

interface LogoutConfirmDialogProps {
  open: boolean
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function LogoutConfirmDialog({
  open,
  isLoading,
  onConfirm,
  onCancel,
}: LogoutConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
        onClick={onCancel}
        disabled={isLoading}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="logout-title"
        aria-describedby="logout-description"
        className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg"
      >
        <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <LogOut className="size-5" />
        </div>

        <h2 id="logout-title" className="text-lg font-semibold tracking-tight">
          Log out of {APP_NAME}?
        </h2>
        <p id="logout-description" className="mt-2 text-sm text-muted-foreground">
          You will need to sign in again to access your chats.
        </p>

        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Logging out..." : "Log out"}
          </Button>
        </div>
      </div>
    </div>
  )
}
