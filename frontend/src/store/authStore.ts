import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginResponse } from '../types'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  idToken: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  userEmail: string | null
  setTokens: (tokens: LoginResponse) => void
  logout: () => void
}

function parseJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1]
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return {}
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      idToken: null,
      isAuthenticated: false,
      isAdmin: false,
      userEmail: null,

      setTokens: (tokens: LoginResponse) => {
        const payload = parseJwtPayload(tokens.accessToken)
        const groups = (payload['cognito:groups'] as string[]) || []
        const isAdmin = groups.some((g) => g.toLowerCase() === 'admin')

        // Try to get email from id token (Cognito puts email in id token)
        const idPayload = tokens.idToken ? parseJwtPayload(tokens.idToken) : {}
        const userEmail = (idPayload['email'] as string) || (payload['email'] as string) || null

        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          idToken: tokens.idToken,
          isAuthenticated: true,
          isAdmin,
          userEmail,
        })
      },

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          idToken: null,
          isAuthenticated: false,
          isAdmin: false,
          userEmail: null,
        }),
    }),
    { name: 'auth-storage' }
  )
)
