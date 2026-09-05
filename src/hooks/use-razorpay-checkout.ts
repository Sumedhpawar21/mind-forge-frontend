import { useCallback, useState } from "react"

import { useAuth } from "@/context/auth-context"
import { paymentApi } from "@/lib/api"
import { APP_NAME } from "@/lib/brand"
import { getRazorpayKeyId, loadRazorpayScript } from "@/lib/razorpay"

interface CheckoutInput {
  amount: number
  currency?: string
  receipt?: string
  planId?: string
  description: string
  onSuccess?: () => void | Promise<void>
}

export function useRazorpayCheckout() {
  const { user } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkout = useCallback(
    async ({
      amount,
      currency = "INR",
      receipt,
      planId,
      description,
      onSuccess,
    }: CheckoutInput) => {
      const keyId = getRazorpayKeyId()
      if (!keyId) {
        throw new Error("Razorpay key is not configured (VITE_RAZORPAY_KEY_ID).")
      }

      setIsProcessing(true)
      setError(null)

      try {
        const ready = await loadRazorpayScript()
        if (!ready || !window.Razorpay) {
          throw new Error("Failed to load Razorpay checkout")
        }

        const orderRes = await paymentApi.createOrder({
          amount,
          currency,
          receipt,
          planId,
        })

        const order = orderRes.data
        if (!order?.order_id) {
          throw new Error("Could not create payment order")
        }

        await new Promise<void>((resolve, reject) => {
          const rzp = new window.Razorpay!({
            key: keyId,
            amount: order.amount,
            currency: order.currency || currency,
            name: APP_NAME,
            description,
            order_id: order.order_id,
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
                  throw new Error(
                    verifyRes.message || "Payment verification failed"
                  )
                }

                await onSuccess?.()
                resolve()
              } catch (err) {
                reject(err)
              }
            },
            modal: {
              ondismiss: () => {
                setError("Payment cancelled")
                resolve()
              },
            },
          })

          rzp.on("payment.failed", (response: { error?: { description?: string } }) => {
            const message =
              response?.error?.description || "Payment failed. Please try again."
            setError(message)
            reject(new Error(message))
          })

          rzp.open()
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : "Payment failed"
        setError(message)
        throw err
      } finally {
        setIsProcessing(false)
      }
    },
    [user]
  )

  return { checkout, isProcessing, error, setError }
}
