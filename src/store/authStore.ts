import { create } from "zustand"
import { supabase } from "../lib/supabase"
import type { User } from "@supabase/supabase-js"
import type { UserProfile } from "../types"

interface AuthState {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (isLoading: boolean) => void
  fetchProfile: (userId: string) => Promise<UserProfile | null>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  fetchProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()

      if (error) {
        console.error("Error fetching profile:", error.message)
        return null
      }

      if (data) {
        set({ profile: data })
      }
      return data
    } catch (err) {
      console.error("Profile fetch failed:", err)
      return null
    }
  },
  logout: async () => {
    set({ isLoading: true })
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error("Error signing out:", err)
    } finally {
      set({ user: null, profile: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
