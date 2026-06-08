import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Sparkles, BookOpen, Wrench } from "lucide-react"

const sections = [
  { title: "Prompts", description: "Edit the agent's system prompt, persona and rules.", icon: Sparkles },
  { title: "FAQ / RAG", description: "Manage the knowledge base the agent answers from.", icon: BookOpen },
  { title: "Tools", description: "Enable and configure the agent's tools.", icon: Wrench },
  { title: "Conversations", description: "Inspect contacts and their conversation threads.", icon: MessageSquare },
]

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Chasqui</h1>
        <p className="text-muted-foreground">
          Configure your WhatsApp AI agent. Modules below land in upcoming sprints.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {sections.map((s) => (
          <Card key={s.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{s.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
