import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type {
  ContactDetail,
  ContactListItem,
  MemoryItem,
  MessageItem,
  Paginated,
  PaginationParams,
} from "@/types/api"

export function useContacts(params: PaginationParams) {
  return useQuery({
    queryKey: ["contacts", params],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<ContactListItem>>(
        "/admin/contacts",
        { params }
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useContact(contactId: string) {
  return useQuery({
    queryKey: ["contacts", contactId],
    queryFn: async () => {
      const { data } = await apiClient.get<ContactDetail>(
        `/admin/contacts/${contactId}`
      )
      return data
    },
  })
}

export function useContactMessages(contactId: string, params: PaginationParams) {
  return useQuery({
    queryKey: ["contacts", contactId, "messages", params],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<MessageItem>>(
        `/admin/contacts/${contactId}/messages`,
        { params }
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useContactMemories(contactId: string) {
  return useQuery({
    queryKey: ["contacts", contactId, "memories"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: MemoryItem[] }>(
        `/admin/contacts/${contactId}/memories`
      )
      return data.items
    },
  })
}
