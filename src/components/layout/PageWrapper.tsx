import React from "react"
import { Navbar } from "./Navbar"
import { useToastStore } from "../../store/toastStore"

interface PageWrapperProps {
  children: React.ReactNode
  title: string
}

export function PageWrapper({ children, title }: PageWrapperProps) {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Padding left on desktop to clear the 64-width fixed sidebar */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Navbar title={title} />
        
        {/* Main Content Area */}
        {/* pb-20 on mobile to clear the bottom navigation bar */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          {children}
        </main>
      </div>

      {/* Global Toast Notifications Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto cursor-pointer p-4 rounded-2xl shadow-xl border text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200 transition-all hover:scale-[1.02] ${
              toast.type === "success"
                ? "bg-safe-50 dark:bg-safe-900/20 border-safe-200 dark:border-safe-800/40 text-safe-600 dark:text-safe-400"
                : toast.type === "error"
                ? "bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800/40 text-danger-600 dark:text-danger-400"
                : "bg-card border-border text-foreground"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}
