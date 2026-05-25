import { create } from "zustand"

export interface Toast {
  id: string
  message: string
  type: "success" | "error" | "info"
}

interface ToastState {
  toasts: Toast[]
  toast: (message: string, type?: "success" | "error" | "info") => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  toast: (message, type = "success") => {
    const id = Math.random().toString(36).substring(7)
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
