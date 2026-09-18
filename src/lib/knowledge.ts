// Pure helpers for the Knowledge Base page — mirrors the core's upload rules
// (knowledge module: extension whitelist, 10 MB cap) so obvious rejections
// never leave the browser. The core stays the authority.

export const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md", ".html"]
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export type UploadRejection = "unsupported" | "tooLarge" | "empty" | "duplicate" | "failed"

export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".")
  return dot <= 0 ? "" : filename.slice(dot).toLowerCase()
}

/** Client-side pre-check; null means "send it". */
export function rejectionFor(file: { name: string; size: number }): UploadRejection | null {
  if (!ACCEPTED_EXTENSIONS.includes(extensionOf(file.name))) return "unsupported"
  if (file.size > MAX_UPLOAD_BYTES) return "tooLarge"
  if (file.size === 0) return "empty"
  return null
}

/** Maps the core's HTTP status to an i18n-able reason (API errors are English-only). */
export function rejectionFromStatus(status: number | undefined): UploadRejection {
  switch (status) {
    case 415:
      return "unsupported"
    case 413:
      return "tooLarge"
    case 400:
      return "empty"
    case 409:
      return "duplicate"
    default:
      return "failed"
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const [value, unit] =
    bytes < 1024 * 1024 ? [bytes / 1024, "KB"] : [bytes / (1024 * 1024), "MB"]
  // One decimal below 10 ("2.5 KB"), none above ("150 KB"); never a trailing ".0"
  return `${value < 10 ? value.toFixed(1).replace(/\.0$/, "") : Math.round(value)} ${unit}`
}
