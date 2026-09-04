import { Check, Loader2, Sparkles, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { paymentApi, plansApi } from "@/lib/api"
import { APP_NAME } from "@/lib/brand"
import { getRazorpayKeyId, loadRazorpayScript } from "@/lib/razorpay"
import { cn } from "@/lib/utils"
import type { Plan } from "@/types"

interface PlansDialogProps {
  open: boolean
  onClose: () => void
}

function formatPrice(price: number) {
  if (price <= 0) return "Free"
  return `₹${price}`
}

export function PlansDialog({ open, onClose }: PlansDialogProps) {
  const { user, subscription, refreshProfile } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [buyingPlanId, setBuyingPlanId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const currentPlanName = subscription?.plan.name ?? null

  const loadPlans = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await plansApi.list()
      const sorted = [...(res.data ?? [])].sort(
        (a, b) => a.max_messages - b.max_messages
      )
      setPlans(sorted)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plans")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setSuccess(null)
    setError(null)
    loadPlans()
  }, [open, loadPlans])

  const handleBuy = async (plan: Plan) => {
    if (plan.price <= 0) {
      setError("This plan is free and assigned automatically.")
      return
    }

    if (currentPlanName === plan.name) return

    const keyId = getRazorpayKeyId()
    if (!keyId) {
      setError("Razorpay key is not configured (VITE_RAZORPAY_KEY_ID).")
      return
    }

    setBuyingPlanId(plan.id)
    setError(null)
    setSuccess(null)

    try {
      const ready = await loadRazorpayScript()
      if (!ready || !window.Razorpay) {
        throw new Error("Failed to load Razorpay checkout")
      }

      const orderRes = await plansApi.buy(plan.id)
      const order = orderRes.data
      if (!order?.id) {
        throw new Error("Could not create payment order")
      }

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key: keyId,
          amount: order.amount,
          currency: order.currency || "INR",
          name: APP_NAME,
          description: `${plan.name} plan`,
          order_id: order.id,
          prefill: {
            name: user?.name,
            email: user?.email,
          },
          theme: { color: "#0f766e" },
          handler: async (response) => {
            try {
              const verifyRes = await paymentApi.verify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })

              if (!verifyRes.success) {
                throw new Error(verifyRes.message || "Payment verification failed")
              }

              await refreshProfile()
              setSuccess(`You're now on the ${plan.name} plan.`)
              resolve()
            } catch (err) {
              reject(err)
            }
          },
          modal: {
            ondismiss: () => resolve(),
          },
        })

        rzp.open()
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed")
    } finally {
      setBuyingPlanId(null)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
        onClick={onClose}
        disabled={!!buyingPlanId}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="plans-title"
        className="relative flex max-h-[min(90vh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-5">
          <div>
            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <h2 id="plans-title" className="text-lg font-semibold tracking-tight">
              Plans & subscription
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {currentPlanName
                ? `Current plan: ${currentPlanName}`
                : "Choose a plan to keep chatting."}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            disabled={!!buyingPlanId}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading plans...
            </div>
          ) : (
            <ul className="space-y-3">
              {plans.map((plan) => {
                const isCurrent = currentPlanName === plan.name
                const isBuying = buyingPlanId === plan.id
                const isPaid = plan.price > 0

                return (
                  <li
                    key={plan.id}
                    className={cn(
                      "rounded-xl border px-4 py-3.5 transition-colors",
                      isCurrent
                        ? "border-primary/40 bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{plan.name}</p>
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                              <Check className="size-3" />
                              Current
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {plan.max_messages} messages · {formatPrice(plan.price)}
                        </p>
                        {plan.description && (
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            {plan.description}
                          </p>
                        )}
                      </div>

                      {isPaid && !isCurrent && (
                        <Button
                          size="sm"
                          onClick={() => handleBuy(plan)}
                          disabled={!!buyingPlanId}
                          className="shrink-0"
                        >
                          {isBuying ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin" />
                              Paying...
                            </>
                          ) : (
                            "Upgrade"
                          )}
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          {success && (
            <p
              role="status"
              className="mt-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary"
            >
              {success}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
