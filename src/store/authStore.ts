import { create } from "zustand"
import type { UserProfile } from "../types"

interface AuthState {
  user: UserProfile | null
  session: any | null
  loading: boolean
  setUser: (user: UserProfile | null) => void
  setSession: (session: any | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  logout: () => set({ user: null, session: null }),
}))
