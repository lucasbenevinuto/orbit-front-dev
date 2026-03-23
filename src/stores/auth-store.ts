import { create } from 'zustand'
import api from '@/lib/api'
import type { User, AuthResponse } from '@/types/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  loginWithGoogle: (credential: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  initialize: () => Promise<void>
}

function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('orbit_access_token', accessToken)
  localStorage.setItem('orbit_refresh_token', refreshToken)
}

function clearTokens() {
  localStorage.removeItem('orbit_access_token')
  localStorage.removeItem('orbit_refresh_token')
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const { data } = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    })
    storeTokens(data.access_token, data.refresh_token)
    set({ user: data.user, isAuthenticated: true })
  },

  register: async (name, email, password) => {
    const { data } = await api.post<AuthResponse>('/auth/register', {
      name,
      email,
      password,
    })
    storeTokens(data.access_token, data.refresh_token)
    set({ user: data.user, isAuthenticated: true })
  },

  loginWithGoogle: async (credential) => {
    const { data } = await api.post<AuthResponse>('/auth/google', {
      credential,
    })
    storeTokens(data.access_token, data.refresh_token)
    set({ user: data.user, isAuthenticated: true })
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Proceed with local cleanup even if the API call fails
    }
    clearTokens()
    set({ user: null, isAuthenticated: false })
    window.location.href = '/login'
  },

  refreshUser: async () => {
    try {
      const { data } = await api.get<User>('/auth/me')
      set({ user: data, isAuthenticated: true })
    } catch {
      clearTokens()
      set({ user: null, isAuthenticated: false })
    }
  },

  initialize: async () => {
    const accessToken = localStorage.getItem('orbit_access_token')
    if (!accessToken) {
      set({ isLoading: false, user: null, isAuthenticated: false })
      return
    }

    try {
      const { data } = await api.get<User>('/auth/me')
      set({ user: data, isAuthenticated: true, isLoading: false })
    } catch {
      clearTokens()
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
