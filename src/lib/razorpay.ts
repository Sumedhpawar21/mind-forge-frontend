let loadingPromise: Promise<boolean> | null = null

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false)
  if (window.Razorpay) return Promise.resolve(true)

  if (!loadingPromise) {
    loadingPromise = new Promise((resolve) => {
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.async = true
      script.onload = () => resolve(true)
      script.onerror = () => {
        loadingPromise = null
        resolve(false)
      }
      document.body.appendChild(script)
    })
  }

  return loadingPromise
}

export function getRazorpayKeyId() {
  return import.meta.env.VITE_RAZORPAY_KEY_ID || ""
}
