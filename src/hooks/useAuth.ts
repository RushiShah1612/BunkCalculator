import { useEffect } from "react"
import { useAuthStore } from "../store/authStore"
import { supabase } from "../lib/supabase"

export function useAuth() {
  const {
    user,
    profile,
    isLoading,
    isAuthenticated,
    setUser,
    setLoading,
    fetchProfile,
    logout,
  } = useAuthStore()

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      
      setUser(data.user)
      if (data.user) {
        await fetchProfile(data.user.id)
      }
      return data
    } finally {
      setLoading(false)
    }
  }

  const register = async (
    email: string,
    password: string,
    fullName: string,
    institution: string,
    semester: string
  ) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            institution: institution || null,
            semester: semester || null,
          },
        },
      })
      if (error) throw error

      // If email verification is disabled, user is immediately logged in
      if (data.user) {
        setUser(data.user)
        await fetchProfile(data.user.id)
      }
      return data
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    profile,
    loading: isLoading,
    isAuthenticated,
    login,
    register,
    logout,
  }
}

export function useAuthListener() {
  const { setUser, setProfile, setLoading, fetchProfile } = useAuthStore()

  useEffect(() => {
    let isMounted = true

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && isMounted) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        }
      } catch (err) {
        console.error("Initial session check failed:", err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return
        
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [setUser, setProfile, setLoading, fetchProfile])
}
