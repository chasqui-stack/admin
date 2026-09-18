import { describe, expect, it } from "vitest"
import {
  MAX_UPLOAD_BYTES,
  extensionOf,
  formatBytes,
  rejectionFor,
  rejectionFromStatus,
} from "@/lib/knowledge"

describe("extensionOf", () => {
  it("lowercases and keeps only the last extension", () => {
    expect(extensionOf("Price List.v2.PDF")).toBe(".pdf")
  })

  it("returns empty for extensionless and dotfiles", () => {
    expect(extensionOf("Makefile")).toBe("")
    expect(extensionOf(".env")).toBe("")
  })
})

describe("rejectionFor", () => {
  it("accepts the core's whitelist", () => {
    for (const name of ["a.pdf", "a.docx", "a.txt", "a.md", "a.html"]) {
      expect(rejectionFor({ name, size: 10 })).toBeNull()
    }
  })

  it("rejects unsupported types before size", () => {
    expect(rejectionFor({ name: "legacy.doc", size: MAX_UPLOAD_BYTES + 1 })).toBe("unsupported")
  })

  it("rejects oversize and empty files", () => {
    expect(rejectionFor({ name: "a.pdf", size: MAX_UPLOAD_BYTES + 1 })).toBe("tooLarge")
    expect(rejectionFor({ name: "a.pdf", size: MAX_UPLOAD_BYTES })).toBeNull()
    expect(rejectionFor({ name: "a.pdf", size: 0 })).toBe("empty")
  })
})

describe("rejectionFromStatus", () => {
  it("maps the core's upload errors", () => {
    expect(rejectionFromStatus(415)).toBe("unsupported")
    expect(rejectionFromStatus(413)).toBe("tooLarge")
    expect(rejectionFromStatus(400)).toBe("empty")
    expect(rejectionFromStatus(409)).toBe("duplicate")
  })

  it("falls back to a generic failure (network error, 500)", () => {
    expect(rejectionFromStatus(undefined)).toBe("failed")
    expect(rejectionFromStatus(500)).toBe("failed")
  })
})

describe("formatBytes", () => {
  it("formats B / KB / MB", () => {
    expect(formatBytes(512)).toBe("512 B")
    expect(formatBytes(2048)).toBe("2 KB")
    expect(formatBytes(2560)).toBe("2.5 KB")
    expect(formatBytes(150 * 1024)).toBe("150 KB")
    expect(formatBytes(3.5 * 1024 * 1024)).toBe("3.5 MB")
    expect(formatBytes(MAX_UPLOAD_BYTES)).toBe("10 MB")
  })
})
