import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { Button } from "../../components/ui/button"
import { GraduationCap, ArrowRight, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean(),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  useEffect(() => {
    document.title = "Log In | RollCall"
  }, [])

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  })

  // Human-readable error translator
  const translateError = (errorStr: string) => {
    if (errorStr.toLowerCase().includes("invalid login credentials")) {
      return "Wrong email or password. Please try again."
    }
    if (errorStr.toLowerCase().includes("email not confirmed")) {
      return "Please check your inbox to confirm your email before signing in."
    }
    return errorStr
  }

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMsg(null)
    try {
      await login(data.email, data.password)
      navigate("/")
    } catch (err: unknown) {
      console.error("Login submission error:", err)
      const rawMsg = err instanceof Error ? err.message : "An unexpected authentication error occurred."
      setErrorMsg(translateError(rawMsg))
    }
  }

  const triggerForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault()
    setToastMsg("Forgot password feature coming soon!")
    setTimeout(() => setToastMsg(null), 3500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-safe/10 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

      <div className="w-full max-w-md bg-card/60 backdrop-blur-md border border-border p-8 rounded-3xl shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight mt-3">
            Welcome back
          </h2>
          <p className="text-sm text-muted-foreground">
            Sign in to track your semester attendance
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs animate-in slide-in-from-top-1">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 pl-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@university.edu"
              {...registerField("email")}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={`w-full px-4 py-3 rounded-xl border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                errors.email ? "border-danger focus:ring-danger/50" : "border-border"
              }`}
            />
            {errors.email && (
              <span id="email-error" className="text-xs text-danger mt-1 block pl-1">
                {errors.email.message}
              </span>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 pl-1">
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <a
                href="#"
                onClick={triggerForgotPassword}
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot?
              </a>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...registerField("password")}
                aria-describedby={errors.password ? "password-error" : undefined}
                className={`w-full px-4 py-3 pr-10 rounded-xl border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                  errors.password ? "border-danger focus:ring-danger/50" : "border-border"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <span id="password-error" className="text-xs text-danger mt-1 block pl-1">
                {errors.password.message}
              </span>
            )}
          </div>

          {/* Remember Me Toggle */}
          <div className="flex items-center space-x-2 pl-1 py-1">
            <input
              type="checkbox"
              id="rememberMe"
              {...registerField("rememberMe")}
              className="rounded border-border bg-background text-primary focus:ring-primary/50"
            />
            <label
              htmlFor="rememberMe"
              className="text-xs font-medium text-muted-foreground select-none cursor-pointer"
            >
              Remember me on this browser
            </label>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-3 h-12 rounded-xl text-sm font-semibold shadow-lg hover:shadow-primary/10 flex items-center justify-center space-x-2 mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        {/* Footer Links */}
        <div className="text-center text-sm text-muted-foreground pt-2">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-primary hover:underline transition-colors"
          >
            Create one free
          </Link>
        </div>
      </div>

      {/* Custom Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-card border border-border shadow-2xl text-sm font-semibold text-foreground animate-in slide-in-from-bottom-5">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
