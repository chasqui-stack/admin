import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { KnowledgeDocument, KnowledgeSearchHit } from "@/types/api"

const BASE = "/admin/modules/knowledge"
const DOCUMENTS_KEY = ["knowledge", "documents"]

// Processing is a background job on the core: the list polls ONLY while a
// document is in flight — no websockets, no eternal polling (omakase).
export const KNOWLEDGE_POLL_MS = 2500

const isInFlight = (document: KnowledgeDocument) =>
  document.status === "pending" || document.status === "processing"

export function useDocuments(options?: { poll?: boolean }) {
  return useQuery({
    queryKey: DOCUMENTS_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<KnowledgeDocument[]>(`${BASE}/documents`)
      return data
    },
    refetchInterval: (query) =>
      options?.poll || query.state.data?.some(isInFlight) ? KNOWLEDGE_POLL_MS : false,
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append("file", file)
      // The client defaults to application/json, which would make axios
      // serialize the FormData as JSON. Declaring multipart lets the browser
      // set the boundary (axios strips the header for FormData bodies).
      const { data } = await apiClient.post<KnowledgeDocument>(`${BASE}/documents`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return data
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY }),
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${BASE}/documents/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY }),
  })
}

export function useReprocessDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<KnowledgeDocument>(
        `${BASE}/documents/${id}/reprocess`
      )
      return data
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY }),
  })
}

export function useKnowledgeSearch(query: string) {
  return useQuery({
    queryKey: ["knowledge", "search", query],
    queryFn: async () => {
      const { data } = await apiClient.get<KnowledgeSearchHit[]>(`${BASE}/search`, {
        params: { q: query },
      })
      return data
    },
    enabled: query.trim().length > 0,
  })
}
