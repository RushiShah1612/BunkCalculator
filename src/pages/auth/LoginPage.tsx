import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { Button } from "../../components/ui/button"
import { GraduationCap, ArrowRight, Loader2 } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.email, data.password)
      navigate("/")
    } catch (err) {
      console.error("Login failed:", err)
    }
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

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 pl-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@university.edu"
              {...registerField("email")}
              className={`w-full px-4 py-3 rounded-xl border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                errors.email ? "border-danger focus:ring-danger/50" : "border-border"
              }`}
            />
            {errors.email && (
              <span className="text-xs text-danger mt-1 block pl-1">
                {errors.email.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 pl-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              {...registerField("password")}
              className={`w-full px-4 py-3 rounded-xl border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                errors.password ? "border-danger focus:ring-danger/50" : "border-border"
              }`}
            />
            {errors.password && (
              <span className="text-xs text-danger mt-1 block pl-1">
                {errors.password.message}
              </span>
            )}
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
    </div>
  )
}
