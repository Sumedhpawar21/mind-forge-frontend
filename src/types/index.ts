export interface UserSubscription {
  usage: number
  plan: {
    name: string
    max_messages: number
  }
}

export interface User {
  id: string
  email: string
  name: string
  avatar: string | null
  subscriptions?: UserSubscription[]
}

export interface Plan {
  id: string
  name: string
  description: string | null
  price: number
  max_messages: number
  createdAt: string
  updatedAt: string
}

export interface Chat {
  id: string
  title: string | null
  userId: string
  createdAt: string
  updatedAt: string
}

export type MessageRole = "User" | "AGENT"

export interface Message {
  id: string
  chatId: string
  content: string
  role: MessageRole
  createdAt: string
  updatedAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}

export interface RazorpayOrder {
  order_id: string
  amount: number
  currency: string
}

export interface RazorpayOrderLegacy {
  id: string
  entity: string
  amount: number
  currency: string
  status: string
  notes?: {
    userId?: string
    name?: string
    email?: string
  }
}

export function getActiveSubscription(user: User | null | undefined) {
  return user?.subscriptions?.[0] ?? null
}
