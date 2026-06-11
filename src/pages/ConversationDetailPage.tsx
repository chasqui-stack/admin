import { useEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft,
  Bot,
  Brain,
  Clock,
  FileAudio,
  Hand,
  Image as ImageIcon,
  MousePointerClick,
  SendHorizontal,
  Siren,
} from "lucide-react"
import {
  useContact,
  useContactMemories,
  useContactMessages,
  useSendOperatorMessage,
  useSetMode,
} from "@/hooks/useContacts"
import type { ContactDetail, MessageItem } from "@/types/api"
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
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 50

// WhatsApp's 24h customer-service window (channel-specific advisory).
// Meta is the authority — the server never blocks; this is honest UX.
const WINDOW_MS = 24 * 60 * 60 * 1000

function whatsappWindow(contact: ContactDetail | undefined) {
  if (!contact || contact.channel !== "whatsapp") return null
  if (!contact.last_inbound_at) return { open: false, remainingMs: 0 }
  const deadline = new Date(contact.last_inbound_at + "Z").getTime() + WINDOW_MS
  const remainingMs = deadline - Date.now()
  return { open: remainingMs > 0, remainingMs: Math.max(0, remainingMs) }
}

function formatRemaining(ms: number): string {
  const hours = Math.floor(ms / 3_600_000)
  const minutes = Math.floor((ms % 3_600_000) / 60_000)
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

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
        {!isInbound && typeof message.meta.sent_by_email === "string" && (
          <span className="mb-1 block text-xs font-medium opacity-80">
            {message.meta.sent_by_email}
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

function Composer({ contact }: { contact: ContactDetail }) {
  const { t } = useTranslation()
  const [text, setText] = useState("")
  const send = useSendOperatorMessage(contact.id)
  const window = whatsappWindow(contact)
  const blocked = window !== null && !window.open

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || send.isPending || blocked) return
    send.mutate(trimmed, { onSuccess: () => setText("") })
  }

  // Gateway error codes travel in detail.code (ADR-004)
  const error = send.error as
    | { response?: { data?: { detail?: { code?: string } } } }
    | null
  const errorCode = error?.response?.data?.detail?.code
  const errorText = send.isError
    ? errorCode === "WINDOW_EXPIRED"
      ? t("conversations.windowExpired")
      : t("conversations.sendError", { code: errorCode ?? "" })
    : null

  return (
    <div className="border-t border-border p-3">
      {window && (
        <p
          className={cn(
            "mb-2 flex items-center gap-1 text-xs",
            window.open ? "text-muted-foreground" : "text-destructive"
          )}
        >
          <Clock className="h-3 w-3" />
          {window.open
            ? t("conversations.windowClosesIn", {
                time: formatRemaining(window.remainingMs),
              })
            : t("conversations.windowExpired")}
        </p>
      )}
      <div className="flex items-end gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder={
            blocked
              ? t("conversations.composerBlocked")
              : t("conversations.composerPlaceholder")
          }
          disabled={blocked || send.isPending}
          rows={2}
          className="min-h-0 resize-none"
        />
        <Button
          onClick={handleSend}
          disabled={blocked || send.isPending || !text.trim()}
        >
          <SendHorizontal className="mr-1 h-4 w-4" />
          {send.isPending ? t("conversations.sending") : t("conversations.send")}
        </Button>
      </div>
      {errorText && <p className="mt-2 text-xs text-destructive">{errorText}</p>}
    </div>
  )
}

export function ConversationDetailPage() {
  const { t, i18n } = useTranslation()
  const { contactId = "" } = useParams()
  const [limit, setLimit] = useState(PAGE_SIZE)

  // The open conversation polls so the operator chat feels live (ADR-004)
  const { data: contact } = useContact(contactId, { poll: true })
  const { data: messages, isLoading } = useContactMessages(
    contactId,
    { limit },
    { poll: true }
  )
  const { data: memories } = useContactMemories(contactId)
  const setMode = useSetMode(contactId)
  const isHuman = contact?.mode === "human"

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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">
              {contact?.display_name ?? contact?.external_id ?? "…"}
            </h1>
            {isHuman && (
              <Badge variant="destructive">
                <Siren className="mr-1 h-3 w-3" />
                {t("conversations.needsHuman")}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {contact?.channel} · {contact?.external_id}
            {contact?.wa_id ? ` · ${contact.wa_id}` : ""}
          </p>
          {isHuman && contact?.handoff_reason && (
            <p className="mt-1 text-sm text-destructive">
              {t("conversations.handoffReason", { reason: contact.handoff_reason })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {contact && (
            <Button
              variant={isHuman ? "secondary" : "default"}
              size="sm"
              disabled={setMode.isPending}
              onClick={() => setMode.mutate(isHuman ? "agent" : "human")}
            >
              {isHuman ? (
                <Bot className="mr-1 h-4 w-4" />
              ) : (
                <Hand className="mr-1 h-4 w-4" />
              )}
              {isHuman ? t("conversations.resumeBot") : t("conversations.takeOver")}
            </Button>
          )}
          {messages && (
            <Badge variant="outline">
              {t("conversations.messages", { count: messages.total })}
            </Badge>
          )}
        </div>
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
          {isHuman && contact && <Composer contact={contact} />}
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
