"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"

export interface User {
  id: string
  email: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
  role: "CUSTOMER" | "PARTNER_ADMIN" | "PLATFORM_OWNER"
  avatarUrl: string | null
  partnerId: string | null
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  error: string | null
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        // Clear any stale localStorage data
        if (typeof window !== "undefined") {
          localStorage.removeItem("user")
        }
      } else {
        setUser(null)
        // Clear localStorage on auth failure
        if (typeof window !== "undefined") {
          localStorage.removeItem("user")
        }
      }
    } catch (err) {
      console.error("Failed to fetch user:", err)
      setError("Failed to fetch user session")
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (err) {
      console.error("Logout error:", err)
    } finally {
      setUser(null)
      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("user")
      }
    }
  }, [])

  useEffect(() => {
    fetchUser()

    // Listen for storage events to sync across tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "logout") {
        setUser(null)
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange)
      return () => window.removeEventListener("storage", handleStorageChange)
    }
  }, [fetchUser])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        refreshUser: fetchUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
