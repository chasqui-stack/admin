import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ChevronRight, MessageSquare } from "lucide-react"
import { useContacts } from "@/hooks/useContacts"
import type { ContactListItem } from "@/types/api"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Pagination } from "@/components/shared/Pagination"
import { SearchInput } from "@/components/shared/SearchInput"

const PAGE_SIZE = 25

function initials(contact: ContactListItem): string {
  const name = contact.display_name ?? contact.external_id
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function ConversationsPage() {
  const { t, i18n } = useTranslation()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const { data, isLoading } = useContacts({
    search: search || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("conversations.title")}</h1>
        <p className="text-muted-foreground">{t("conversations.subtitle")}</p>
      </div>

      <div className="max-w-sm">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder={t("conversations.searchPlaceholder")}
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-muted-foreground">{t("common.loading")}</p>
          ) : !data?.items.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("conversations.empty")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {data.items.map((contact) => (
                <li key={contact.id}>
                  <Link
                    to={`/conversations/${contact.id}`}
                    className="flex items-center gap-4 py-3 transition-colors hover:bg-accent/50"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {initials(contact)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">
                          {contact.display_name ?? contact.external_id}
                        </p>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {contact.channel}
                        </Badge>
                        <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:inline">
                          {contact.wa_id ?? contact.external_id}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {contact.last_message?.text ??
                          (contact.last_message
                            ? t(`conversations.type.${contact.last_message.type}`, {
                                defaultValue: contact.last_message.type,
                              })
                            : t("conversations.noMessages"))}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {t("conversations.messages", { count: contact.message_count })}
                      </span>
                      {contact.last_message && (
                        <span>
                          {new Date(
                            contact.last_message.created_at + "Z"
                          ).toLocaleDateString(i18n.language)}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
