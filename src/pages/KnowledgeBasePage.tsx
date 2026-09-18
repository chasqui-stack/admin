import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { isAxiosError } from "axios"
import { toast } from "sonner"
import { Loader2, RefreshCw, Search, Trash2, UploadCloud } from "lucide-react"
import {
  useDeleteDocument,
  useDocuments,
  useKnowledgeSearch,
  useReprocessDocument,
  useUploadDocument,
} from "@/hooks/useKnowledge"
import {
  ACCEPTED_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  extensionOf,
  formatBytes,
  rejectionFor,
  rejectionFromStatus,
} from "@/lib/knowledge"
import { cn } from "@/lib/utils"
import type { KnowledgeDocument, KnowledgeDocumentStatus } from "@/types/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

// `uploading` exists only in the browser, while the POST is in flight
type RowStatus = KnowledgeDocumentStatus | "uploading"

interface PendingUpload {
  key: string
  filename: string
  size_bytes: number
}

const STATUS_STYLES: Record<RowStatus, string> = {
  uploading: "border-muted-foreground/30 bg-muted text-muted-foreground",
  pending: "border-muted-foreground/30 bg-muted text-muted-foreground",
  processing: "border-muted-foreground/30 bg-muted text-muted-foreground",
  ready: "border-success/30 bg-success/10 text-success",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
}

function DocumentStatusBadge({ status, detail }: { status: RowStatus; detail?: string | null }) {
  const { t } = useTranslation()
  const inFlight = status !== "ready" && status !== "error"

  return (
    <Badge
      variant="outline"
      title={detail ?? undefined}
      className={cn("gap-1 font-normal", STATUS_STYLES[status], inFlight && "animate-pulse")}
    >
      {inFlight && <Loader2 className="h-3 w-3 animate-spin" />}
      {t(`knowledge.status.${status}`)}
    </Badge>
  )
}

function TypeBadge({ filename }: { filename: string }) {
  return (
    <Badge variant="secondary" className="font-mono text-xs uppercase">
      {extensionOf(filename).slice(1) || "?"}
    </Badge>
  )
}

function Dropzone({
  onFiles,
  disabled,
}: {
  onFiles: (files: File[]) => void
  disabled: boolean
}) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragOver={(e) => {
        // Without preventDefault the browser opens the file and onDrop never fires
        e.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (!disabled) onFiles(Array.from(e.dataTransfer.files))
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-card px-6 py-10 text-center transition-colors",
        // Amber (the ring token) is the one accent — border/ring only, never text
        "hover:border-ring/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        dragging && "border-ring bg-ring/5 ring-2 ring-ring/40",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <UploadCloud className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium">
        {disabled ? t("knowledge.dropzone.uploading") : t("knowledge.dropzone.title")}
      </p>
      <p className="text-xs text-muted-foreground">
        {t("knowledge.dropzone.hint", {
          types: ACCEPTED_EXTENSIONS.join(" "),
          size: formatBytes(MAX_UPLOAD_BYTES),
        })}
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_EXTENSIONS.join(",")}
        className="hidden"
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []))
          e.target.value = "" // let the same file be picked again
        }}
      />
    </div>
  )
}

function SearchPreview() {
  const { t } = useTranslation()
  const [input, setInput] = useState("")
  const [query, setQuery] = useState("")
  const { data: hits, isFetching } = useKnowledgeSearch(query)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("knowledge.preview.title")}</CardTitle>
        <CardDescription>{t("knowledge.preview.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setQuery(input)
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("knowledge.preview.placeholder")}
          />
          <Button type="submit" disabled={isFetching || input.trim() === ""}>
            <Search className="mr-2 h-4 w-4" />
            {t("knowledge.preview.run")}
          </Button>
        </form>

        {query && hits && hits.length === 0 && !isFetching && (
          <p className="text-sm text-muted-foreground">{t("knowledge.preview.noResults")}</p>
        )}
        {hits && hits.length > 0 && (
          <ul className="space-y-3">
            {hits.map((hit) => (
              <li
                key={`${hit.document_id}-${hit.seq}`}
                className="rounded-md border border-border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">
                    {hit.filename}
                    <span className="ml-2 font-normal text-muted-foreground">
                      {t("knowledge.preview.chunk", { seq: hit.seq + 1 })}
                    </span>
                  </p>
                  <Badge variant="outline" className="shrink-0 font-mono text-xs">
                    {(hit.similarity * 100).toFixed(1)}% {t("knowledge.preview.similarity")}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-4 whitespace-pre-line text-sm text-muted-foreground">
                  {hit.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function KnowledgeBasePage() {
  const { t, i18n } = useTranslation()
  const uploadDocument = useUploadDocument()
  const deleteDocument = useDeleteDocument()
  const reprocessDocument = useReprocessDocument()

  const [uploads, setUploads] = useState<PendingUpload[]>([])
  const [deleting, setDeleting] = useState<KnowledgeDocument | null>(null)

  const isUploading = uploads.length > 0
  // The hook keeps polling while any document is pending/processing
  const { data: documents, isLoading } = useDocuments({ poll: isUploading })

  const handleFiles = async (files: File[]) => {
    const accepted: { key: string; file: File }[] = []
    for (const file of files) {
      const rejection = rejectionFor(file)
      if (rejection) {
        toast.error(t(`knowledge.rejected.${rejection}`, { filename: file.name }))
      } else {
        accepted.push({ key: crypto.randomUUID(), file })
      }
    }
    if (accepted.length === 0) return

    setUploads(
      accepted.map(({ key, file }) => ({ key, filename: file.name, size_bytes: file.size }))
    )
    // Sequential on purpose: simple, and the core dedupes by sha256 anyway
    for (const { key, file } of accepted) {
      try {
        await uploadDocument.mutateAsync(file)
      } catch (error) {
        const status = isAxiosError(error) ? error.response?.status : undefined
        toast.error(
          t(`knowledge.rejected.${rejectionFromStatus(status)}`, { filename: file.name })
        )
      } finally {
        setUploads((current) => current.filter((u) => u.key !== key))
      }
    }
  }

  const handleReprocess = async (document: KnowledgeDocument) => {
    try {
      await reprocessDocument.mutateAsync(document.id)
      toast.success(t("knowledge.reprocessStarted"))
    } catch {
      toast.error(t("knowledge.reprocessError"))
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await deleteDocument.mutateAsync(deleting.id)
      toast.success(t("knowledge.deleted"))
    } catch {
      toast.error(t("common.error"))
    } finally {
      setDeleting(null)
    }
  }

  const isEmpty = !documents?.length && !isUploading

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("knowledge.title")}</h1>
        <p className="text-muted-foreground">{t("knowledge.subtitle")}</p>
      </div>

      <Dropzone onFiles={handleFiles} disabled={isUploading} />

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-muted-foreground">{t("common.loading")}</p>
          ) : isEmpty ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("knowledge.empty")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("knowledge.columns.document")}</TableHead>
                  <TableHead>{t("knowledge.columns.type")}</TableHead>
                  <TableHead>{t("knowledge.columns.size")}</TableHead>
                  <TableHead>{t("knowledge.columns.status")}</TableHead>
                  <TableHead className="text-right">{t("knowledge.columns.chunks")}</TableHead>
                  <TableHead>{t("knowledge.columns.uploaded")}</TableHead>
                  <TableHead className="w-28 text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploads.map((upload) => (
                  <TableRow key={upload.key}>
                    <TableCell className="max-w-xs truncate font-medium">
                      {upload.filename}
                    </TableCell>
                    <TableCell>
                      <TypeBadge filename={upload.filename} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatBytes(upload.size_bytes)}
                    </TableCell>
                    <TableCell>
                      <DocumentStatusBadge status="uploading" />
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">—</TableCell>
                    <TableCell className="text-sm text-muted-foreground">—</TableCell>
                    <TableCell />
                  </TableRow>
                ))}
                {documents?.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell className="max-w-xs truncate font-medium" title={document.filename}>
                      {document.filename}
                    </TableCell>
                    <TableCell>
                      <TypeBadge filename={document.filename} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatBytes(document.size_bytes)}
                    </TableCell>
                    <TableCell>
                      <DocumentStatusBadge
                        status={document.status}
                        detail={document.error_detail}
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                      {document.status === "ready" ? document.chunk_count : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(document.created_at + "Z").toLocaleDateString(i18n.language)}
                    </TableCell>
                    <TableCell className="text-right">
                      {document.status === "error" && document.can_reprocess && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReprocess(document)}
                          disabled={reprocessDocument.isPending}
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span className="sr-only">{t("knowledge.reprocess")}</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setDeleting(document)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{t("common.delete")}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SearchPreview />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("knowledge.deleteTitle")}
        description={t("knowledge.deleteConfirm", { filename: deleting?.filename ?? "" })}
        confirmLabel={t("common.delete")}
        onConfirm={handleDelete}
        isLoading={deleteDocument.isPending}
        variant="destructive"
      />
    </div>
  )
}
