import { NavLink, Link } from "react-router-dom"
import { 
  LayoutDashboard, 
  BookOpen, 
  CalendarCheck, 
  BarChart3,
  GraduationCap,
  User,
  Settings
} from "lucide-react"

const desktopNavItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Subjects", path: "/subjects", icon: BookOpen },
  { label: "Attendance", path: "/attendance", icon: CalendarCheck },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Profile", path: "/profile", icon: User },
  { label: "Settings", path: "/settings", icon: Settings },
]

const mobileNavItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Subjects", path: "/subjects", icon: BookOpen },
  { label: "Attendance", path: "/attendance", icon: CalendarCheck },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
]

export function Sidebar() {
  return (
    <>
      {/* Desktop Sidebar (Left Panel) */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-border bg-card/65 backdrop-blur-md z-20">
        {/* Brand Logo Header */}
        <Link to="/" className="flex items-center space-x-3 h-16 px-6 border-b border-border hover:opacity-80 transition-opacity">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-foreground tracking-tight">
            RollCall
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {desktopNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer Info */}
        <div className="p-6 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground text-center">
            Attendance Tracker v1.0
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-card/85 backdrop-blur-lg z-30 flex justify-around items-center px-2 pb-safe">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-150
              ${
                isActive
                  ? "text-primary scale-110 font-semibold"
                  : "text-muted-foreground"
              }
            `}
          >
            <item.icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
