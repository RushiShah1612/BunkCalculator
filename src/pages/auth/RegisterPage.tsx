import { useState, useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { Button } from "../../components/ui/button"
import { GraduationCap, ArrowRight, Loader2, Eye, EyeOff, AlertCircle, Mail } from "lucide-react"

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    institution: z.string().optional(),
    semester: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { register, loading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    document.title = "Register | RollCall"
  }, [])

  const {
    register: registerField,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      institution: "",
      semester: "",
    },
  })

  // Watch password field to compute strength indicator
  const passwordValue = useWatch({ control, name: "password", defaultValue: "" })

  // Password strength calculations
  const calculatePasswordStrength = (pwd: string) => {
    let score = 0
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    return score
  }

  const strengthScore = calculatePasswordStrength(passwordValue)

  const getStrengthMeta = (score: number) => {
    if (!passwordValue) return { label: "No password", color: "bg-muted", width: "w-0" }
    switch (score) {
      case 1:
        return { label: "Very Weak", color: "bg-danger", width: "w-1/4" }
      case 2:
        return { label: "Weak", color: "bg-warning", width: "w-2/4" }
      case 3:
        return { label: "Medium", color: "bg-blue-500", width: "w-3/4" }
      case 4:
        return { label: "Strong", color: "bg-safe", width: "w-full" }
      default:
        return { label: "Too Short", color: "bg-danger", width: "w-[15%]" }
    }
  }

  const strengthMeta = getStrengthMeta(strengthScore)

  const translateError = (errorStr: string) => {
    if (errorStr.toLowerCase().includes("user already registered")) {
      return "Account already exists with this email address. Try logging in instead."
    }
    return errorStr
  }

  const onSubmit = async (data: RegisterFormValues) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      await register(
        data.email,
        data.password,
        data.fullName,
        data.institution || "",
        data.semester || ""
      )
      setSuccessMsg(
        "Check your email to verify your account! We've sent a verification link to " +
          data.email
      )
    } catch (err: unknown) {
      console.error("Registration submission error:", err)
      const rawMsg = err instanceof Error ? err.message : "An unexpected registration error occurred."
      setErrorMsg(translateError(rawMsg))
    }
  }

  // Render check success layout
  if (successMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-safe/10 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

        <div className="w-full max-w-md bg-card/60 backdrop-blur-md border border-border p-8 rounded-3xl shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-safe/10 text-safe border border-safe/20">
            <Mail className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Confirm your email</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We have sent a verification link to your email address. Please check your inbox and click the link to activate your account.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/login">
              <Button className="w-full py-3 rounded-xl text-sm font-semibold">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
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
            Create an Account
          </h2>
          <p className="text-sm text-muted-foreground">
            Get started with tracking your academic logs
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs animate-in slide-in-from-top-1">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 pl-1">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="John Doe"
              {...registerField("fullName")}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
              className={`w-full px-4 py-2.5 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                errors.fullName ? "border-danger focus:ring-danger/50" : "border-border"
              }`}
            />
            {errors.fullName && (
              <span id="fullName-error" className="text-xs text-danger mt-1 block pl-1">
                {errors.fullName.message}
              </span>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 pl-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@university.edu"
              {...registerField("email")}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={`w-full px-4 py-2.5 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                errors.email ? "border-danger focus:ring-danger/50" : "border-border"
              }`}
            />
            {errors.email && (
              <span id="email-error" className="text-xs text-danger mt-1 block pl-1">
                {errors.email.message}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="institution" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 pl-1">
                Institution
              </label>
              <input
                id="institution"
                type="text"
                placeholder="Vite University"
                {...registerField("institution")}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <div>
              <label htmlFor="semester" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 pl-1">
                Semester
              </label>
              <input
                id="semester"
                type="text"
                placeholder="Semester 4"
                {...registerField("semester")}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 pl-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...registerField("password")}
                aria-describedby={errors.password ? "password-error" : undefined}
                className={`w-full px-4 py-2.5 pr-10 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
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

            {/* Password strength indicator bar */}
            {passwordValue && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider pl-1">
                  <span className="text-muted-foreground">Strength:</span>
                  <span className={strengthMeta.color.replace("bg-", "text-")}>
                    {strengthMeta.label}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${strengthMeta.color} ${strengthMeta.width}`} />
                </div>
              </div>
            )}
            
            {errors.password && (
              <span id="password-error" className="text-xs text-danger mt-1 block pl-1">
                {errors.password.message}
              </span>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 pl-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                {...registerField("confirmPassword")}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                className={`w-full px-4 py-2.5 pr-10 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                  errors.confirmPassword ? "border-danger focus:ring-danger/50" : "border-border"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span id="confirmPassword-error" className="text-xs text-danger mt-1 block pl-1">
                {errors.confirmPassword.message}
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
                <span>Sign Up</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        {/* Footer Links */}
        <div className="text-center text-sm text-muted-foreground pt-2">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary hover:underline transition-colors"
          >
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  )
}
