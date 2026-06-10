import { useEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Brain, FileAudio, Image as ImageIcon, MousePointerClick } from "lucide-react"
import {
  useContact,
  useContactMemories,
  useContactMessages,
} from "@/hooks/useContacts"
import type { MessageItem } from "@/types/api"
import { MessageMedia } from "@/components/shared/MessageMedia"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 50

const TYPE_ICONS: Record<string, typeof FileAudio> = {
  audio: FileAudio,
  image: ImageIcon,
  button: MousePointerClick,
}

function MessageBubble({ message }: { message: MessageItem }) {
  const { t, i18n } = useTranslation()
  const isInbound = message.direction === "in"
  const TypeIcon = TYPE_ICONS[message.type]

  return (
    <div className={cn("flex", isInbound ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[75%] rounded-lg px-3 py-2 text-sm",
          isInbound ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
        )}
      >
        {TypeIcon && (
          <span className="mb-1 flex items-center gap-1 text-xs opacity-70">
            <TypeIcon className="h-3 w-3" />
            {t(`conversations.type.${message.type}`, { defaultValue: message.type })}
          </span>
        )}
        <MessageMedia message={message} />
        {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
        <p
          className={cn(
            "mt-1 text-right text-[10px]",
            isInbound ? "text-muted-foreground" : "text-primary-foreground/70"
          )}
        >
          {new Date(message.created_at + "Z").toLocaleTimeString(i18n.language, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  )
}

export function ConversationDetailPage() {
  const { t, i18n } = useTranslation()
  const { contactId = "" } = useParams()
  const [limit, setLimit] = useState(PAGE_SIZE)

  const { data: contact } = useContact(contactId)
  const { data: messages, isLoading } = useContactMessages(contactId, { limit })
  const { data: memories } = useContactMemories(contactId)

  // API returns newest-first; the chat renders oldest-first
  const timeline = [...(messages?.items ?? [])].reverse()
  const hasOlder = (messages?.total ?? 0) > (messages?.items.length ?? 0)

  // Pin the scroll to the newest message on first load (and contact switch);
  // "load older" grows upward without yanking the view to the bottom.
  const scrollRef = useRef<HTMLDivElement>(null)
  const newestId = messages?.items[0]?.id
  const pinnedFor = useRef<string | null>(null)
  useEffect(() => {
    const el = scrollRef.current
    if (!el || newestId === undefined) return
    if (pinnedFor.current !== contactId) {
      pinnedFor.current = contactId
      el.scrollTop = el.scrollHeight
    }
  }, [newestId, contactId])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/conversations">
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("conversations.back")}
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {contact?.display_name ?? contact?.external_id ?? "…"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {contact?.channel} · {contact?.external_id}
            {contact?.wa_id ? ` · ${contact.wa_id}` : ""}
          </p>
        </div>
        {messages && (
          <Badge variant="outline">
            {t("conversations.messages", { count: messages.total })}
          </Badge>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="flex h-[calc(100vh-15rem)] min-h-[320px] flex-col overflow-hidden">
          <CardContent
            ref={scrollRef}
            className="flex-1 overflow-y-auto pt-6"
          >
            {isLoading ? (
              <p className="text-muted-foreground">{t("common.loading")}</p>
            ) : timeline.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("conversations.noMessages")}
              </p>
            ) : (
              <div className="space-y-3">
                {hasOlder && (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLimit(limit + PAGE_SIZE)}
                    >
                      {t("conversations.loadOlder")}
                    </Button>
                  </div>
                )}
                {timeline.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="max-h-[calc(100vh-15rem)] overflow-y-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-4 w-4" />
              {t("conversations.memories")}
            </CardTitle>
            <CardDescription>{contact?.display_name}</CardDescription>
          </CardHeader>
          <CardContent>
            {!memories?.length ? (
              <p className="text-sm text-muted-foreground">
                {t("conversations.noMemories")}
              </p>
            ) : (
              <ul className="space-y-2">
                {memories.map((memory) => (
                  <li
                    key={memory.id}
                    className="rounded-md border border-border p-2 text-sm"
                  >
                    {memory.content}
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {new Date(memory.created_at + "Z").toLocaleDateString(
                        i18n.language
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
