import { useState, useRef, useEffect } from "react"
import { Bell, BellOff, Info, AlertTriangle, AlertCircle, CheckCircle2, Trash2, Check } from "lucide-react"
import { useNotificationStore } from "../../store/notificationStore"
import { Button } from "../ui/button"

export function NotificationBell() {
  const { notifications, markAllRead, dismissAll } = useNotificationStore()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const getIcon = (type: string) => {
    switch (type) {
      case "danger":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      case "info":
      default:
        return <Info className="w-4 h-4 text-blue-500" />
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "danger":
        return "bg-red-500/10 border-red-500/10"
      case "warning":
        return "bg-amber-500/10 border-amber-500/10"
      case "success":
        return "bg-emerald-500/10 border-emerald-500/10"
      case "info":
      default:
        return "bg-blue-500/10 border-blue-500/10"
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground relative"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[480px] bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllRead}
                    className="text-xs h-7 px-2 rounded-lg text-primary hover:text-primary/80 hover:bg-primary/5"
                    title="Mark all as read"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Read
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={dismissAll}
                    className="text-xs h-7 px-2 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/5"
                    title="Dismiss all"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Clear
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <BellOff className="w-5 h-5 text-muted-foreground/45" />
                </div>
                <p className="font-semibold text-xs text-foreground">All caught up!</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  No new attendance warnings or bunk recommendations.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 flex gap-3 transition-colors hover:bg-muted/10 ${
                    !n.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${getBgColor(n.type)}`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <p className="text-xs font-bold text-foreground truncate">{n.title}</p>
                      <span className="text-[9px] text-muted-foreground shrink-0 font-medium mt-0.5">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1 font-medium break-words">
                      {n.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
