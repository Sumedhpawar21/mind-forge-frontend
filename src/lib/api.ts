import type {
  ApiResponse,
  Chat,
  Message,
  Pagination,
  Plan,
  RazorpayOrder,
  RazorpayOrderLegacy,
  User,
} from "@/types"

const TOKEN_KEY = "gpt-token"
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || ""

function apiUrl(path: string) {
  return `${BACKEND_URL}${path}`
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  if (token) {
    ;(headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(apiUrl(path), {
    ...options,
    headers,
    credentials: "include",
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "Request failed",
    }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

export const authApi = {
  login: (id_token: string) =>
    request<ApiResponse<{ token: string; user: User }>>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ id_token }),
    }),

  logout: () =>
    request<ApiResponse>("/api/auth/logout", { method: "POST" }),

  me: () => request<ApiResponse<User>>("/api/auth/me"),
}

export const chatApi = {
  list: (page = 1, limit = 50) =>
    request<
      ApiResponse<{ chats: Chat[]; pagination: Pagination }>
    >(`/api/chat?page=${page}&limit=${limit}`),

  delete: (chatId: string) =>
    request<ApiResponse<Chat>>(`/api/chat/${chatId}`, {
      method: "DELETE",
    }),
}

export const messageApi = {
  list: (chatId: string, page = 1, limit = 100) =>
    request<
      ApiResponse<{ messages: Message[]; pagination: Pagination }>
    >(`/api/messages/${chatId}?page=${page}&limit=${limit}`),

  send: async (
    user_message: string,
    chatId?: string,
    onChunk?: (chunk: string) => void
  ): Promise<{ chatId: string; fullText: string }> => {
    const token = getToken()
    const response = await fetch(apiUrl("/api/messages/"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
      body: JSON.stringify({ user_message, chatId }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to send message",
      }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    const resolvedChatId =
      response.headers.get("X-Chat-Id") || chatId || ""

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error("No response stream")
    }

    const decoder = new TextDecoder()
    let fullText = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      fullText += chunk
      onChunk?.(chunk)
    }

    return { chatId: resolvedChatId, fullText }
  },
}

export const subscriptionApi = {
  usage: () =>
    request<{
      status?: boolean
      success?: boolean
      message: string
      data: {
        usage: number
        remaining_messages?: number
        plan: { max_messages: number; name?: string }
      } | null
    }>("/api/subscription/usage"),
}

export const plansApi = {
  list: () =>
    request<{ status?: boolean; success?: boolean; message: string; data: Plan[] }>(
      "/api/plans/"
    ),

  buy: (planId: string) =>
    request<ApiResponse<RazorpayOrderLegacy>>(`/api/plans/buy/${planId}`, {
      method: "POST",
    }),
}

export const paymentApi = {
  createOrder: (payload: {
    amount: number
    currency?: string
    receipt?: string
    planId?: string
  }) =>
    request<ApiResponse<RazorpayOrder>>("/api/create-order", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  verify: (payload: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
  }) =>
    request<ApiResponse>("/api/verify-payment", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
}
