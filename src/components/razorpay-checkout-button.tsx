import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useRazorpayCheckout } from "@/hooks/use-razorpay-checkout"

interface RazorpayCheckoutButtonProps {
  amount: number
  currency?: string
  receipt?: string
  planId?: string
  description: string
  label?: string
  disabled?: boolean
  onSuccess?: () => void | Promise<void>
}

export function RazorpayCheckoutButton({
  amount,
  currency = "INR",
  receipt,
  planId,
  description,
  label = "Pay now",
  disabled,
  onSuccess,
}: RazorpayCheckoutButtonProps) {
  const { checkout, isProcessing, error, setError } = useRazorpayCheckout()

  const handleClick = async () => {
    setError(null)
    try {
      await checkout({
        amount,
        currency,
        receipt,
        planId,
        description,
        onSuccess,
      })
    } catch {
      // error state handled in hook
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        disabled={disabled || isProcessing || amount < 100}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Processing...
          </>
        ) : (
          label
        )}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
