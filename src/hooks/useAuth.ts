import { useAuthStore } from "../store/authStore"

export function useAuth() {
  const { user, session, loading, logout, setUser, setSession, setLoading } = useAuthStore()

  const login = async (email: string, _: string) => {
    setLoading(true)
    try {
      // Mock login for Prompt 1 verification
      const mockUser = {
        id: "mock-user-id",
        email,
        full_name: "Mock Student",
        institution: "Vite University",
        semester: "Semester 4",
        created_at: new Date().toISOString(),
      }
      setUser(mockUser)
      setSession({ access_token: "mock-token" })
    } finally {
      setLoading(false)
    }
  }

  const register = async (email: string, fullName: string, institution: string, semester: string) => {
    setLoading(true)
    try {
      // Mock registration
      const mockUser = {
        id: "mock-user-id",
        email,
        full_name: fullName,
        institution: institution || null,
        semester: semester || null,
        created_at: new Date().toISOString(),
      }
      setUser(mockUser)
      setSession({ access_token: "mock-token" })
    } finally {
      setLoading(false)
    }
  }

  const mockLogout = () => {
    logout()
  }

  return {
    user,
    session,
    loading,
    logout: mockLogout,
    login,
    register,
  }
}
