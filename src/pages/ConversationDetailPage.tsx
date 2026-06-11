import { useEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft,
  Bot,
  Brain,
  Clock,
  FileAudio,
  FileText,
  Hand,
  Image as ImageIcon,
  Mic,
  MousePointerClick,
  Paperclip,
  SendHorizontal,
  Siren,
  Smile,
  Square,
  X,
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
  document: FileText,
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

// Curated grid — dependency-free; the OS picker still works on top
const EMOJIS = [
  "😀", "😊", "😂", "😉", "😍", "🥰", "😎", "🤔", "😅", "😢",
  "😡", "🙏", "👍", "👎", "👋", "🤝", "👏", "💪", "🙌", "✌️",
  "❤️", "💔", "🎉", "🔥", "⭐", "✅", "❌", "⚠️", "📦", "🚚",
  "💰", "🧾", "📍", "📞", "⏰", "📅", "🛠️", "🤖", "🙋", "🫡",
]

// Meta's per-type media limits (decoded bytes)
const MAX_MB: Record<string, number> = { image: 5, document: 25, audio: 16 }

const ACCEPT_FILES =
  "image/jpeg,image/png,image/webp,application/pdf," +
  ".doc,.docx,.xls,.xlsx"

interface Attachment {
  kind: "image" | "document" | "audio"
  dataUri: string
  mime: string
  name?: string
}

function Composer({ contact }: { contact: ContactDetail }) {
  const { t } = useTranslation()
  const [text, setText] = useState("")
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [recording, setRecording] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const send = useSendOperatorMessage(contact.id)
  const window = whatsappWindow(contact)
  const blocked = window !== null && !window.open

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current
    const start = el?.selectionStart ?? text.length
    const end = el?.selectionEnd ?? text.length
    setText(text.slice(0, start) + emoji + text.slice(end))
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      el.selectionStart = el.selectionEnd = start + emoji.length
    })
  }

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const kind = file.type.startsWith("image/") ? "image" : "document"
    if (file.size > MAX_MB[kind] * 1024 * 1024) {
      setLocalError(t("conversations.attachTooLarge", { mb: MAX_MB[kind] }))
      return
    }
    setLocalError(null)
    const reader = new FileReader()
    reader.onload = () =>
      setAttachment({
        kind,
        dataUri: reader.result as string,
        mime: file.type,
        name: file.name,
      })
    reader.readAsDataURL(file)
  }

  const toggleRecording = async () => {
    if (recording) {
      recorderRef.current?.stop()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // WhatsApp accepts AAC (m4a) or Opus-in-OGG only. Ask for AAC
      // explicitly — Chrome's bare "audio/mp4" muxes OPUS into MP4, which
      // Meta rejects asynchronously. Opus fallbacks get remuxed to OGG by
      // the gateway (ffmpeg) before hitting Meta.
      const mime =
        ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm'].find((m) =>
          MediaRecorder.isTypeSupported(m)
        ) ?? "audio/webm"
      const recorder = new MediaRecorder(stream, { mimeType: mime })
      const chunks: Blob[] = []
      recorder.ondataavailable = (ev) => {
        if (ev.data.size) chunks.push(ev.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        const reader = new FileReader()
        reader.onload = () =>
          setAttachment({ kind: "audio", dataUri: reader.result as string, mime })
        reader.readAsDataURL(new Blob(chunks, { type: mime }))
        setRecording(false)
      }
      recorderRef.current = recorder
      recorder.start()
      setRecording(true)
      setLocalError(null)
    } catch {
      setLocalError(t("conversations.micDenied"))
    }
  }

  const canSend = !blocked && !send.isPending && !recording
  const handleSend = () => {
    if (!canSend) return
    const trimmed = text.trim()
    const reset = () => {
      setText("")
      setAttachment(null)
      setShowEmoji(false)
    }
    if (attachment) {
      send.mutate(
        {
          type: attachment.kind,
          // WhatsApp voice notes carry no caption; image/document do
          text: attachment.kind === "audio" ? null : trimmed || null,
          media_data_uri: attachment.dataUri,
          filename: attachment.name ?? null,
        },
        { onSuccess: reset }
      )
    } else if (trimmed) {
      send.mutate({ type: "text", text: trimmed }, { onSuccess: reset })
    }
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
    : localError

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

      {attachment && (
        <div className="mb-2 flex items-center gap-2 rounded-md border border-border p-2">
          {attachment.kind === "image" ? (
            <img
              src={attachment.dataUri}
              alt={attachment.name ?? t("conversations.mediaImageAlt")}
              className="h-12 w-12 rounded object-cover"
            />
          ) : attachment.kind === "audio" ? (
            <audio controls src={attachment.dataUri} className="h-9 w-56" />
          ) : (
            <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
          )}
          {attachment.name && (
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {attachment.name}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            aria-label={t("conversations.removeAttachment")}
            onClick={() => setAttachment(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {showEmoji && (
        <div className="mb-2 flex flex-wrap gap-1 rounded-md border border-border p-2">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="rounded p-1 text-lg leading-none hover:bg-accent"
              onClick={() => insertEmoji(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          aria-label={t("conversations.emoji")}
          disabled={blocked}
          onClick={() => setShowEmoji(!showEmoji)}
        >
          <Smile className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t("conversations.attach")}
          disabled={blocked || recording}
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Button
          variant={recording ? "destructive" : "ghost"}
          size="sm"
          aria-label={
            recording
              ? t("conversations.stopRecording")
              : t("conversations.record")
          }
          disabled={blocked}
          onClick={toggleRecording}
        >
          {recording ? (
            <Square className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
        <input
          ref={fileRef}
          type="file"
          hidden
          accept={ACCEPT_FILES}
          onChange={onPickFile}
        />
        <Textarea
          ref={textareaRef}
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
              : recording
                ? t("conversations.recording")
                : t("conversations.composerPlaceholder")
          }
          disabled={blocked || send.isPending}
          rows={2}
          className="min-h-0 resize-none"
        />
        <Button
          onClick={handleSend}
          disabled={!canSend || (!text.trim() && !attachment)}
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

  // Pin the scroll to the newest message on first load (and contact switch).
  // While pinned near the bottom, FOLLOW new messages (own sends + polled
  // inbound); "load older" grows upward without yanking the view down.
  const scrollRef = useRef<HTMLDivElement>(null)
  const newestId = messages?.items[0]?.id
  const pinnedFor = useRef<string | null>(null)
  const atBottom = useRef(true)
  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }
  useEffect(() => {
    const el = scrollRef.current
    if (!el || newestId === undefined) return
    if (pinnedFor.current !== contactId) {
      pinnedFor.current = contactId
      atBottom.current = true
      el.scrollTop = el.scrollHeight
      return
    }
    if (atBottom.current) el.scrollTop = el.scrollHeight
  }, [newestId, contactId])

  // Media loads AFTER the message renders (presigned URL fetch + lazy <img>),
  // growing the content under an already-positioned scroll — re-anchor on any
  // content growth while pinned, or the view stays cut off mid-image.
  const contentRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = scrollRef.current
    const content = contentRef.current
    if (!el || !content) return
    const observer = new ResizeObserver(() => {
      if (atBottom.current) el.scrollTop = el.scrollHeight
    })
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

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
            onScroll={handleScroll}
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
