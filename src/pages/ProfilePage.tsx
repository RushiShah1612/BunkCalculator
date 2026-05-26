import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { PageWrapper } from "../components/layout/PageWrapper"
import { useAuthStore } from "../store/authStore"
import { useAuth } from "../hooks/useAuth"
import { supabase } from "../lib/supabase"
import { useToastStore } from "../store/toastStore"
import { ConfirmDialog } from "../components/shared/ConfirmDialog"
import { Button } from "../components/ui/button"
import {
  User,
  Mail,
  Building2,
  GraduationCap,
  Edit3,
  Lock,
  Trash2,
  Check,
  X,
  Eye,
  EyeOff,
  LogOut,
} from "lucide-react"

// ─── Initials Avatar ──────────────────────────────────────────────────────────

function Avatar({ name, size = "lg" }: { name: string; size?: "sm" | "lg" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const colors = [
    "from-indigo-500 to-purple-600",
    "from-blue-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-red-600",
    "from-pink-500 to-rose-600",
  ]
  const colorIdx = name.charCodeAt(0) % colors.length

  const sizeClasses = size === "lg"
    ? "w-20 h-20 text-2xl"
    : "w-10 h-10 text-base"

  return (
    <div
      className={`${sizeClasses} rounded-2xl bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-white font-bold shadow-xl`}
    >
      {initials || "?"}
    </div>
  )
}

// ─── Field Row ────────────────────────────────────────────────────────────────

function FieldRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border/40 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value || "—"}</p>
      </div>
    </div>
  )
}

// ─── Edit Profile Form ────────────────────────────────────────────────────────

function EditProfileForm({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  const { profile, setProfile, user } = useAuthStore()
  const { toast } = useToastStore()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    institution: profile?.institution ?? "",
    semester: profile?.semester ?? "",
  })

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name,
          institution: form.institution || null,
          semester: form.semester || null,
        })
        .eq("id", user.id)
        .select()
        .single()

      if (error) throw error
      if (data) setProfile(data)
      toast("Profile updated!", "success")
      onSaved()
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed"
      toast(msg, "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-3xl border border-primary/20 bg-muted/20 p-5 space-y-4 animate-in fade-in duration-200">
      <h3 className="font-bold text-foreground">Edit Profile</h3>
      {[
        { key: "full_name", label: "Full Name", placeholder: "Your name" },
        { key: "institution", label: "Institution", placeholder: "Your college / university" },
        { key: "semester", label: "Semester", placeholder: "e.g. Semester 5, Fall 2024" },
      ].map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
            {label}
          </label>
          <input
            value={form[key as keyof typeof form]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            placeholder={placeholder}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <Button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl" size="sm">
          {saving ? "Saving…" : <><Check className="w-4 h-4 mr-1" />Save</>}
        </Button>
        <Button variant="outline" onClick={onClose} className="rounded-xl" size="sm">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Change Password Form ─────────────────────────────────────────────────────

function ChangePasswordForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToastStore()
  const [form, setForm] = useState({ newPassword: "", confirm: "" })
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setError(null)
    if (form.newPassword.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    if (form.newPassword !== form.confirm) {
      setError("Passwords do not match.")
      return
    }
    setSaving(true)
    try {
      const { error: err } = await supabase.auth.updateUser({ password: form.newPassword })
      if (err) throw err
      toast("Password updated!", "success")
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed"
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-muted/10 p-5 space-y-4 animate-in fade-in duration-200">
      <h3 className="font-bold text-foreground flex items-center gap-2">
        <Lock className="w-4 h-4 text-primary" /> Change Password
      </h3>
      {error && (
        <p className="text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-xl">{error}</p>
      )}
      {[
        { key: "newPassword", label: "New Password" },
        { key: "confirm", label: "Confirm Password" },
      ].map(({ key, label }) => (
        <div key={key} className="relative">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
            {label}
          </label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 pr-10 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <Button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl" size="sm">
          {saving ? "Updating…" : "Update Password"}
        </Button>
        <Button variant="outline" onClick={onClose} className="rounded-xl" size="sm">
          Cancel
        </Button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { profile, user } = useAuthStore()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToastStore()

  const [editingProfile, setEditingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    document.title = "My Profile | RollCall"
  }, [])

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    try {
      // Delete all user data (Supabase RLS cascade will handle subjects + records)
      if (user) {
        await supabase.from("profiles").delete().eq("id", user.id)
      }
      await logout()
      navigate("/login")
      toast("Account deleted.", "success")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed"
      toast(msg, "error")
    } finally {
      setDeleteLoading(false)
    }
  }

  const name = profile?.full_name || user?.email || "Unknown"

  return (
    <PageWrapper title="Profile">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Profile Card ── */}
        <div className="rounded-3xl border border-border bg-card overflow-hidden">
          {/* Color header strip */}
          <div className="h-24 bg-gradient-to-r from-primary/30 via-purple-500/20 to-pink-500/10" />

          <div className="px-6 pb-6 -mt-10">
            <div className="flex items-end justify-between mb-4">
              <Avatar name={name} size="lg" />
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setEditingProfile((v) => !v)}
              >
                <Edit3 className="w-4 h-4 mr-1.5" />
                {editingProfile ? "Cancel" : "Edit"}
              </Button>
            </div>

            <h2 className="text-xl font-bold text-foreground">{name}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>

            {editingProfile ? (
              <div className="mt-5">
                <EditProfileForm
                  onClose={() => setEditingProfile(false)}
                  onSaved={() => setRefreshKey((k) => k + 1)}
                />
              </div>
            ) : (
              <div className="mt-5 space-y-0" key={refreshKey}>
                <FieldRow icon={User} label="Full Name" value={profile?.full_name} />
                <FieldRow icon={Mail} label="Email" value={user?.email} />
                <FieldRow icon={Building2} label="Institution" value={profile?.institution} />
                <FieldRow icon={GraduationCap} label="Semester" value={profile?.semester} />
              </div>
            )}
          </div>
        </div>

        {/* ── Account Actions ── */}
        <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-bold text-foreground">Account Settings</h3>

          {/* Change Password */}
          {changingPassword ? (
            <ChangePasswordForm onClose={() => setChangingPassword(false)} />
          ) : (
            <button
              onClick={() => setChangingPassword(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/40 hover:bg-muted/70 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Change Password</p>
                <p className="text-xs text-muted-foreground">Update your account password</p>
              </div>
            </button>
          )}

          {/* Sign Out */}
          <button
            onClick={async () => { await logout(); navigate("/login") }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/40 hover:bg-muted/70 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Sign Out</p>
              <p className="text-xs text-muted-foreground">Log out of your account</p>
            </div>
          </button>

          {/* Delete Account */}
          <button
            onClick={() => setDeleteDialogOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/5 hover:bg-red-500/10 transition-colors text-left border border-red-500/10"
          >
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">Delete Account</p>
              <p className="text-xs text-muted-foreground">Permanently delete all your data</p>
            </div>
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Your Account?"
        description="This will permanently delete all your subjects, attendance records, and profile data. This cannot be undone."
        confirmLabel={deleteLoading ? "Deleting…" : "Delete My Account"}
        confirmTextMatch={user?.email ?? "delete"}
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteDialogOpen(false)}
        variant="destructive"
      />
    </PageWrapper>
  )
}
