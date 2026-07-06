import { Link, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  LayoutDashboard,
  MessageSquare,
  UserPlus,
  Bot,
  Settings,
  Users,
} from "lucide-react"
import { useContacts } from "@/hooks/useContacts"
import { cn } from "@/lib/utils"

const navigation = [
  { key: "nav.conversations", href: "/conversations", icon: MessageSquare },
  { key: "nav.leads", href: "/leads", icon: UserPlus },
  { key: "Reportes", href: "/dashboard", icon: LayoutDashboard },
  { key: "Agente IA", href: "/agents", icon: Bot },
]

export function Sidebar() {
  const { t } = useTranslation()
  const location = useLocation()
  // Waiting-for-human badge on the conversations entry (polls, ADR-004)
  const { data: humanCount } = useContacts({ mode: "human", limit: 1 }, { poll: true })

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center border-b border-sidebar-border px-3">
        {/* The lockup SVG carries the same charcoal canvas as --sidebar: seamless */}
        <div className="flex items-center gap-2 px-2 text-white"><span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-600 text-sm font-black">a</span><span className="text-xl font-semibold tracking-tight">agil.ai</span></div>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        <p className="px-3 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Trabajo diario</p>
        {navigation.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? location.pathname === "/dashboard"
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
              {item.key.includes("nav.") ? t(item.key) : item.key}
              {item.href === "/conversations" && (humanCount?.total ?? 0) > 0 && (
                <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
                  {humanCount?.total}
                </span>
              )}
            </Link>
          )
        })}
        <div className="my-3 border-t border-sidebar-border" />
        <Link to="/users" className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors", location.pathname.startsWith("/users") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}><Users className="h-4 w-4"/>Equipo y permisos</Link>
        <Link to="/settings" className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors", location.pathname.startsWith("/settings") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}><Settings className="h-4 w-4"/>Configuración</Link>
      </nav>
    </aside>
  )
}
