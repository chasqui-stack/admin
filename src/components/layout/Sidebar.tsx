import { Link, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  BookOpen,
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  Wrench,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { key: "nav.dashboard", href: "/", icon: LayoutDashboard },
  { key: "nav.prompt", href: "/prompt", icon: Sparkles },
  { key: "nav.faq", href: "/faq", icon: BookOpen },
  { key: "nav.tools", href: "/tools", icon: Wrench },
  { key: "nav.conversations", href: "/conversations", icon: MessageSquare },
]

export function Sidebar() {
  const { t } = useTranslation()
  const location = useLocation()

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <span className="text-lg font-semibold text-sidebar-foreground">Chasqui</span>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive =
            item.href === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.href)

          return (
            <Link
              key={item.key}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.key)}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
