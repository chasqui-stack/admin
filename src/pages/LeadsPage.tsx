import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ChevronDown, Filter, Pencil, Plus, Search, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { useLeads } from "@/hooks/useLeads"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Pagination } from "@/components/shared/Pagination"
import { cn } from "@/lib/utils"
import type { Lead } from "@/types/api"

const PAGE_SIZE = 25

const demoLeads: Lead[] = [
  {
    id: "demo-lead-1",
    contact_id: "demo-1",
    contact_display_name: "Cliente de ejemplo",
    name: "Mariana Torres",
    interest: "Plan Growth",
    email: "mariana@empresa.demo",
    phone: "+1 305 555 0184",
    notes: "Solicitó una demostración para su equipo comercial.",
    extra: { empresa: "Northwind", equipo: "8 vendedores" },
    created_at: new Date().toISOString().replace("Z", ""),
  },
  {
    id: "demo-lead-2",
    contact_id: "demo-2",
    contact_display_name: "Prospecto demo",
    name: "Diego Ramírez",
    interest: "Automatización WhatsApp",
    email: "diego@negocio.demo",
    phone: "+1 786 555 0120",
    notes: "Pendiente enviar cotización.",
    extra: { origen: "WhatsApp" },
    created_at: new Date(Date.now() - 86400000).toISOString().replace("Z", ""),
  },
]

export function LeadsPage() {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [allResults, setAllResults] = useState(false)
  const { data, isLoading } = useLeads({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE })

  const source = data?.items.length ? data.items : import.meta.env.DEV ? demoLeads : []
  const leads = useMemo(
    () => source.filter((lead) =>
      [lead.name, lead.contact_display_name, lead.email, lead.phone, lead.interest]
        .filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())
    ),
    [source, search]
  )
  const total = data?.items.length ? data.total : source.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const all = leads.length > 0 && selected.length === leads.length
  const selectionCount = allResults ? total : selected.length
  const toggleAll = () => {
    setAllResults(false)
    setSelected(all ? [] : leads.map((lead) => lead.id))
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-3.5rem)] min-h-[620px] flex-col overflow-hidden bg-white">
      <div className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-5">
        <div className="flex h-full items-center gap-2 text-sm font-semibold text-blue-700">
          <UserPlus className="h-4 w-4" />
          Leads
          <span className="absolute mt-[53px] h-0.5 w-[70px] rounded-full bg-blue-600" />
        </div>
        <p className="hidden text-xs text-slate-500 md:block">Gestión de oportunidades comerciales</p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Tabla de leads</h1>
            <p className="text-xs text-slate-500">{t("leads.subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar leads…" className="pl-9" />
            </div>
            <Button variant="outline"><Filter className="mr-2 h-4 w-4" />Filtros</Button>
            <Button onClick={() => toast.info("La creación manual se habilitará al conectar el formulario")}> <Plus className="mr-2 h-4 w-4" />Nuevo lead</Button>
          </div>
        </div>

        {selectionCount > 0 && (
          <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 text-xs font-semibold text-blue-800">{selectionCount} seleccionados{allResults ? " · tabla completa" : ""}</span>
              <BulkSelect placeholder="Cambiar etapa…" options={["Nuevo", "Calificado", "Propuesta", "Ganado"]} />
              <BulkSelect placeholder="Asignar owner…" options={["Ana", "Carlos", "María", "Sin asignar"]} />
              <BulkSelect placeholder="Gestionar etiqueta…" options={["Lead caliente", "Seguimiento", "Cliente"]} />
              <BulkSelect placeholder="Más acciones…" options={["Exportar", "Archivar", "Sincronizar con CRM"]} />
              <Button size="sm" onClick={() => toast.success(`${selectionCount} leads actualizados`)}>Aplicar cambios</Button>
              <Button size="sm" variant="ghost" onClick={() => { setSelected([]); setAllResults(false) }}>Cancelar</Button>
            </div>
          </div>
        )}

        <div className="overflow-auto border bg-white">
          <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-2">
            <span className="text-sm font-semibold">{total} leads</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button size="sm" variant="outline">Seleccionar <ChevronDown className="ml-2 h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onClick={() => { setAllResults(false); setSelected(leads.map((lead) => lead.id)) }}>Todos los visibles ({leads.length})</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setAllResults(true); setSelected(leads.map((lead) => lead.id)) }}>Todos los {total} registros de la tabla</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isLoading && !source.length ? (
            <p className="p-8 text-center text-sm text-slate-500">{t("common.loading")}</p>
          ) : !leads.length ? (
            <p className="p-8 text-center text-sm text-slate-500">{search ? "No hay leads que coincidan con la búsqueda." : t("leads.empty")}</p>
          ) : (
            <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600"><tr>
                <Cell head className="w-12 text-center"><input type="checkbox" checked={all} onChange={toggleAll} /></Cell>
                <Cell head className="w-12" />
                <Cell head>Nombre</Cell><Cell head>Conversación</Cell><Cell head>Email</Cell><Cell head>Teléfono</Cell><Cell head>Interés</Cell><Cell head>Datos extra</Cell><Cell head>Fecha</Cell>
              </tr></thead>
              <tbody>{leads.map((lead) => (
                <tr key={lead.id} className={cn("hover:bg-blue-50/30", (allResults || selected.includes(lead.id)) && "bg-blue-50")}>
                  <Cell className="text-center"><input type="checkbox" checked={allResults || selected.includes(lead.id)} onChange={() => { setAllResults(false); setSelected((items) => items.includes(lead.id) ? items.filter((id) => id !== lead.id) : [...items, lead.id]) }} /></Cell>
                  <Cell className="text-center"><button className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button></Cell>
                  <Cell><span className="font-semibold">{lead.name}</span>{lead.notes && <p className="mt-0.5 max-w-56 truncate text-xs text-slate-500">{lead.notes}</p>}</Cell>
                  <Cell><Link to={`/conversations/${lead.contact_id}`} className="font-medium text-blue-700 hover:underline">{lead.contact_display_name ?? t("leads.viewConversation")}</Link></Cell>
                  <Cell><span className="text-xs text-slate-600">{lead.email ?? "—"}</span></Cell>
                  <Cell><span className="text-xs text-slate-600">{lead.phone ?? "—"}</span></Cell>
                  <Cell><GridSelect value={lead.interest ?? "Sin definir"} options={[lead.interest ?? "Sin definir", "Plan Starter", "Plan Growth", "Automatización WhatsApp"]} /></Cell>
                  <Cell><div className="flex max-w-64 flex-wrap gap-1">{Object.keys(lead.extra).length ? Object.entries(lead.extra).map(([key, value]) => <span key={key} className="rounded-full border bg-white px-2 py-0.5 text-[10px] text-slate-600">{key}: {value}</span>) : "—"}</div></Cell>
                  <Cell><span className="text-slate-500">{new Date(lead.created_at + "Z").toLocaleDateString(i18n.language)}</span></Cell>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
        {totalPages > 1 && <div className="mt-4"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>}
        {source === demoLeads && <p className="mt-3 text-[11px] text-slate-400">Datos de demostración visibles solo en desarrollo.</p>}
      </div>
    </div>
  )
}

function Cell({ head = false, className, children }: { head?: boolean; className?: string; children?: React.ReactNode }) {
  const Tag = head ? "th" : "td"
  return <Tag className={cn("h-12 border-b border-r border-slate-200 px-3 last:border-r-0", head && "h-11 font-semibold", className)}>{children}</Tag>
}

function GridSelect({ value, options }: { value: string; options: string[] }) {
  return <select defaultValue={value} className="h-9 w-full min-w-32 cursor-pointer bg-transparent pr-2 text-sm outline-none hover:text-blue-700">{Array.from(new Set(options)).map((option) => <option key={option}>{option}</option>)}</select>
}

function BulkSelect({ placeholder, options }: { placeholder: string; options: string[] }) {
  return <select defaultValue="" className="h-8 rounded-md border bg-white px-2 text-xs"><option value="">{placeholder}</option>{options.map((option) => <option key={option}>{option}</option>)}</select>
}
