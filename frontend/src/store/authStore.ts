import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginResponse } from '../types'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  idToken: string | null
  isAuthenticated: boolean
  setTokens: (tokens: LoginResponse) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      idToken: null,
      isAuthenticated: false,

      setTokens: (tokens: LoginResponse) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          idToken: tokens.idToken,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          idToken: null,
          isAuthenticated: false,
        }),
    }),
    { name: 'auth-storage' }
  )
)
