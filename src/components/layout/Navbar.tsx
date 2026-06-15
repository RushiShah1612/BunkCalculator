import { useEffect, useState } from "react"
import { Sun, Moon, LogOut, User, GraduationCap } from "lucide-react"
import { Link } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { Button } from "../ui/button"
import { ConfirmDialog } from "../shared/ConfirmDialog"
import { NotificationBell } from "./NotificationBell"

interface NavbarProps {
  title: string
}

export function Navbar({ title }: NavbarProps) {
  const { user, profile, logout } = useAuth()
  const [isDark, setIsDark] = useState(() => {
    const storedTheme = localStorage.getItem("theme")
    if (storedTheme) return storedTheme === "dark"
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  })
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev
      localStorage.setItem("theme", next ? "dark" : "light")
      return next
    })
  }

  // Ensure theme is synced on mount
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center space-x-2.5">
          {/* Brand Logo & Name (Visible on mobile/tablet, hidden on desktop screens with sidebar) */}
          <Link to="/" className="flex items-center space-x-2 md:hidden hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/10">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-foreground tracking-tight">
              RollCall
            </span>
          </Link>

          {/* Separator between brand name and page title (mobile only) */}
          <span className="hidden xs:inline md:hidden text-muted-foreground/30 font-light text-lg">/</span>

          <h1 className="text-lg font-bold text-foreground md:text-2xl m-0 tracking-tight">
            {title}
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* Notifications */}
          {user && <NotificationBell />}

          {/* User Info & Logout */}
          {user && (
            <div className="flex items-center space-x-3 pl-2 border-l border-border">
              <Link
                to="/profile"
                className="flex items-center space-x-3 hover:opacity-80 transition-all duration-200"
                title="View Profile"
              >
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-sm font-semibold text-foreground">
                    {profile?.full_name || user.email}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {profile?.semester || "Student"}
                  </span>
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
                  {profile?.full_name ? (
                    profile.full_name.charAt(0)
                  ) : user.email ? (
                    user.email.charAt(0).toUpperCase()
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLogoutConfirm(true)}
                className="rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </header>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Confirm Log Out"
        description="Are you sure you want to log out of your account? Your session will be terminated."
        confirmLabel="Log Out"
        onConfirm={() => {
          setShowLogoutConfirm(false)
          logout()
        }}
        onCancel={() => setShowLogoutConfirm(false)}
        variant="destructive"
      />
    </>
  )
}
