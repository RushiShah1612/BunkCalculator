import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface AppNotification {
  id: string
  type: "danger" | "warning" | "success" | "info"
  title: string
  message: string
  createdAt: string
  read: boolean
}

interface NotificationState {
  notifications: AppNotification[]
  addNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void
  markAllRead: () => void
  dismissAll: () => void
  setNotifications: (ns: AppNotification[]) => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (n) =>
        set((state) => ({
          notifications: [
            {
              ...n,
              id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              createdAt: new Date().toISOString(),
              read: false,
            },
            ...state.notifications.slice(0, 49), // keep max 50
          ],
        })),
      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
      dismissAll: () => set({ notifications: [] }),
      setNotifications: (notifications) => set({ notifications }),
    }),
    { name: "app-notifications" }
  )
)
