export interface User {
  id: string
  email: string
  name: string
  avatar: string | null
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
