import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { authApi, clearToken, getToken, setToken, subscriptionApi } from "@/lib/api"
import { getActiveSubscription, getSubscriptionRemaining, type User, type UserSubscription } from "@/types"

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  subscription: UserSubscription | null
  messagesUsed: number
  messagesLimit: number
  messagesRemaining: number
  isLimitReached: boolean
  login: (idToken: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshUsage: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const res = await authApi.me()
      setUser(res.data ?? null)
    } catch {
      clearToken()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const login = useCallback(async (idToken: string) => {
    const res = await authApi.login(idToken)
    if (res.data?.token) {
      setToken(res.data.token)
      // Login payload omits subscription — refresh full profile
      try {
        const profile = await authApi.me()
        setUser(profile.data ?? res.data.user)
      } catch {
        setUser(res.data.user)
      }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      clearToken()
      setUser(null)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      return
    }

    try {
      const res = await authApi.me()
      setUser(res.data ?? null)
    } catch {
      // Keep existing user on transient refresh failures
    }
  }, [])

  const refreshUsage = useCallback(async () => {
    const token = getToken()
    if (!token) return

    try {
      const res = await subscriptionApi.usage()
      if (!res.data) return

      setUser((prev) => {
        if (!prev) return prev
        const current = prev.subscriptions?.[0]

        return {
          ...prev,
          subscriptions: [
            {
              usage: res.data!.usage,
              remaining_messages: res.data!.remaining_messages,
              plan: {
                name: current?.plan.name ?? "Plan",
                max_messages: res.data!.plan.max_messages,
              },
            },
          ],
        }
      })
    } catch {
      // Keep existing usage on transient refresh failures
    }
  }, [])

  const subscription = getActiveSubscription(user)
  const messagesUsed = subscription?.usage ?? 0
  const messagesRemaining = getSubscriptionRemaining(subscription)
  const messagesLimit = subscription?.plan.max_messages ?? 0
  const isLimitReached =
    messagesLimit > 0 ? messagesUsed >= messagesLimit : false

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      subscription,
      messagesUsed,
      messagesLimit,
      messagesRemaining,
      isLimitReached,
      login,
      logout,
      refreshProfile,
      refreshUsage,
    }),
    [
      user,
      isLoading,
      subscription,
      messagesUsed,
      messagesLimit,
      messagesRemaining,
      isLimitReached,
      login,
      logout,
      refreshProfile,
      refreshUsage,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
