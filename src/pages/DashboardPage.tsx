import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, MessageSquare, Siren, Sparkles, UserPlus, Wrench } from "lucide-react"
import { useContacts } from "@/hooks/useContacts"

const sections = [
  { titleKey: "nav.prompt", descriptionKey: "dashboard.promptCard", href: "/prompt", icon: Sparkles },
  { titleKey: "nav.faq", descriptionKey: "dashboard.faqCard", href: "/faq", icon: BookOpen },
  { titleKey: "nav.tools", descriptionKey: "dashboard.toolsCard", href: "/tools", icon: Wrench },
  { titleKey: "nav.conversations", descriptionKey: "dashboard.conversationsCard", href: "/conversations", icon: MessageSquare },
  { titleKey: "nav.leads", descriptionKey: "dashboard.leadsCard", href: "/leads", icon: UserPlus },
]

export function DashboardPage() {
  const { t } = useTranslation()
  // Conversations waiting for a human (polls — the dashboard is the lobby)
  const { data: humanCount } = useContacts({ mode: "human", limit: 1 }, { poll: true })
  const waiting = humanCount?.total ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link to="/conversations?mode=human">
          <Card
            className={
              waiting > 0
                ? "h-full border-destructive/50 transition-colors hover:border-destructive"
                : "h-full transition-colors hover:border-primary/50"
            }
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.humanCount")}
              </CardTitle>
              <Siren
                className={
                  waiting > 0 ? "h-4 w-4 text-destructive" : "h-4 w-4 text-muted-foreground"
                }
              />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{waiting}</p>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.humanCountCard")}
              </p>
            </CardContent>
          </Card>
        </Link>
        {sections.map((s) => (
          <Link key={s.titleKey} to={s.href}>
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t(s.titleKey)}</CardTitle>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{t(s.descriptionKey)}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
