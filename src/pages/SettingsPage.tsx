import { useEffect, useState } from "react"
import { ArrowRight, Bell, Building2, Check, Clock3, Database, Globe2, Palette, Plus, Save, ShieldCheck, Tag, Trash2, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { MetaSetupPanel } from "@/components/settings/MetaSetupPanel"

type Settings = {
  language: string; timezone: string; dateFormat: string; company: string
  desktopNotifications: boolean; assignmentNotifications: boolean; weeklyDigest: boolean
  defaultAssignment: string; inactivityMinutes: string
}

const defaults: Settings = {
  language: "es", timezone: "America/New_York", dateFormat: "DD/MM/YYYY", company: "agil.ai",
  desktopNotifications: true, assignmentNotifications: true, weeklyDigest: false,
  defaultAssignment: "round_robin", inactivityMinutes: "30",
}

type ChatLabel = { id: number; name: string; color: string; description: string }
const defaultLabels: ChatLabel[] = [
  { id: 1, name: "Lead caliente", color: "#ef4444", description: "Quiere comprar o cotizar pronto" },
  { id: 2, name: "Seguimiento", color: "#f59e0b", description: "Requiere una próxima acción" },
  { id: 3, name: "Cliente", color: "#10b981", description: "Ya realizó una compra" },
]

export function SettingsPage() {
  const { i18n } = useTranslation()
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem("agilai_general_settings")
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults
  })
  const [labels, setLabels] = useState<ChatLabel[]>(() => {
    const saved = localStorage.getItem("agilai_chat_labels")
    return saved ? JSON.parse(saved) : defaultLabels
  })
  const [newLabel, setNewLabel] = useState({ name: "", color: "#2563eb" })

  useEffect(() => { i18n.changeLanguage(settings.language) }, [settings.language, i18n])
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings(s => ({ ...s, [key]: value }))
  const save = () => { localStorage.setItem("agilai_general_settings", JSON.stringify(settings)); localStorage.setItem("agilai_chat_labels", JSON.stringify(labels)); toast.success("Preferencias guardadas") }
  const addLabel = () => {
    if (!newLabel.name.trim()) return toast.error("Escribe un nombre para la etiqueta")
    setLabels(items => [...items, { id: Date.now(), name: newLabel.name.trim(), color: newLabel.color, description: "Etiqueta personalizada" }])
    setNewLabel({ name: "", color: "#2563eb" })
  }

  return <div className="mx-auto max-w-6xl space-y-8 p-8 lg:p-10">
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><p className="mb-2 text-xs font-bold uppercase tracking-[.22em] text-blue-600">Administración</p><h1 className="text-4xl font-semibold tracking-[-.04em]">Configuración general</h1><p className="mt-2 text-muted-foreground">Preferencias que se aplican a toda la organización y a su equipo.</p></div>
      <Button onClick={save} className="bg-blue-600 text-white hover:bg-blue-700"><Save className="mr-2 h-4 w-4"/>Guardar cambios</Button>
    </header>

    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <Section icon={Globe2} title="Idioma y región" description="Cómo se muestra el panel para tu organización.">
        <Field label="Idioma del panel"><Select value={settings.language} onChange={v=>update("language",v)} options={[["es","Español"],["en","English"]]}/></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Zona horaria"><Select value={settings.timezone} onChange={v=>update("timezone",v)} options={[["America/New_York","Nueva York"],["America/Bogota","Bogotá"],["America/Mexico_City","Ciudad de México"],["America/Santiago","Santiago"],["Europe/Madrid","Madrid"]]}/></Field><Field label="Formato de fecha"><Select value={settings.dateFormat} onChange={v=>update("dateFormat",v)} options={[["DD/MM/YYYY","DD/MM/AAAA"],["MM/DD/YYYY","MM/DD/AAAA"],["YYYY-MM-DD","AAAA-MM-DD"]]}/></Field></div>
      </Section>

      <Section icon={Building2} title="Organización" description="Identidad operativa del espacio de trabajo.">
        <Field label="Nombre de la organización"><Input value={settings.company} onChange={e=>update("company",e.target.value)}/></Field>
        <div className="grid grid-cols-3 gap-3"><Mini icon={Users} label="Equipo" value="4 roles"/><Mini icon={Palette} label="Marca" value="Editable"/><Mini icon={ShieldCheck} label="Seguridad" value="Activa"/></div>
        <p className="text-xs text-muted-foreground">Logo, colores y brandbook se administrarán desde la configuración de marca de la organización.</p>
      </Section>

      <Section icon={Users} title="Operación comercial" description="Valores por defecto para conversaciones nuevas.">
        <Field label="Asignación predeterminada"><Select value={settings.defaultAssignment} onChange={v=>update("defaultAssignment",v)} options={[["round_robin","Round robin"],["manual","Manual"],["specialty","Por especialidad"]]}/></Field>
        <Field label="Marcar conversación inactiva después de"><div className="relative"><Input type="number" min="5" value={settings.inactivityMinutes} onChange={e=>update("inactivityMinutes",e.target.value)} className="pr-20"/><span className="absolute right-3 top-2.5 text-sm text-muted-foreground">minutos</span></div></Field>
      </Section>

      <Section icon={Bell} title="Notificaciones" description="Señales importantes sin llenar el día de ruido.">
        <Toggle label="Notificaciones del navegador" description="Nuevos mensajes y solicitudes de atención." checked={settings.desktopNotifications} onChange={v=>update("desktopNotifications",v)}/>
        <Toggle label="Nueva asignación" description="Avisar al vendedor cuando recibe una conversación." checked={settings.assignmentNotifications} onChange={v=>update("assignmentNotifications",v)}/>
        <Toggle label="Resumen semanal" description="Actividad, leads y tiempos de respuesta por correo." checked={settings.weeklyDigest} onChange={v=>update("weeklyDigest",v)}/>
      </Section>
    </div>

    <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
      <Section icon={Tag} title="Etiquetas de conversaciones" description="Clasifica, filtra y automatiza el seguimiento de cada chat.">
        <div className="space-y-2">{labels.map(label => <div key={label.id} className="group flex items-center gap-3 rounded-xl border bg-white p-3">
          <span className="h-3 w-3 shrink-0 rounded-full" style={{backgroundColor:label.color}}/><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{label.name}</p><p className="truncate text-xs text-muted-foreground">{label.description}</p></div>
          <button aria-label={`Eliminar ${label.name}`} onClick={()=>setLabels(items=>items.filter(item=>item.id!==label.id))} className="rounded-lg p-2 text-slate-400 opacity-60 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"><Trash2 className="h-4 w-4"/></button>
        </div>)}</div>
        <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row">
          <input aria-label="Color de etiqueta" type="color" className="h-10 w-12 shrink-0 rounded-md border bg-white p-1" value={newLabel.color} onChange={e=>setNewLabel({...newLabel,color:e.target.value})}/>
          <Input placeholder="Nueva etiqueta, ej. Cotización enviada" value={newLabel.name} onChange={e=>setNewLabel({...newLabel,name:e.target.value})} onKeyDown={e=>e.key==="Enter"&&addLabel()}/>
          <Button variant="outline" onClick={addLabel}><Plus className="mr-2 h-4 w-4"/>Agregar</Button>
        </div>
        <p className="text-xs text-muted-foreground">Consejo: usa pocas etiquetas globales. Las etapas del embudo deben venir del CRM para evitar información duplicada.</p>
      </Section>

      <Section icon={Database} title="Preparación para CRM" description="Define el contrato ahora; conecta la API cuando esté disponible.">
        <div className="space-y-3">
          <Mapping from="Contacto de WhatsApp" to="Contacto / Lead" detail="teléfono como identificador principal"/>
          <Mapping from="Conversación" to="Actividad" detail="resumen, WhatsApp, agente y responsable"/>
          <Mapping from="Etiquetas" to="Campos o categorías" detail="mapeo configurable, sin duplicar etapas"/>
          <Mapping from="Vendedor" to="Propietario" detail="asignación y sincronización bidireccional"/>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><b>Reservado desde ahora:</b> IDs externos, estado de sincronización, fecha de última actualización y registro de errores.</div>
        <Button variant="outline" className="w-full" disabled>Configurar mapeo de campos <span className="ml-2 text-xs text-muted-foreground">al conectar el CRM</span></Button>
      </Section>
    </div>

    <MetaSetupPanel />

    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-950"><Check className="mr-2 inline h-4 w-4 text-blue-600"/><b>Mi recomendación:</b> mantener Conversaciones como inicio, notificaciones solo para asignaciones y solicitudes humanas, y configuración avanzada separada por organización para no confundir a los vendedores.</div>
  </div>
}

function Section({icon:Icon,title,description,children}:{icon:typeof Globe2;title:string;description:string;children:React.ReactNode}) { return <Card className="border-0 shadow-[0_8px_30px_rgba(15,23,42,.07)]"><CardHeader><div className="flex gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-950 text-white"><Icon className="h-4 w-4"/></div><div><CardTitle className="text-lg">{title}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{description}</p></div></div></CardHeader><CardContent className="space-y-5">{children}</CardContent></Card> }
function Field({label,children}:{label:string;children:React.ReactNode}) { return <div className="space-y-2"><Label>{label}</Label>{children}</div> }
function Select({value,onChange,options}:{value:string;onChange:(value:string)=>void;options:string[][]}) { return <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={value} onChange={e=>onChange(e.target.value)}>{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select> }
function Toggle({label,description,checked,onChange}:{label:string;description:string;checked:boolean;onChange:(v:boolean)=>void}) { return <div className="flex items-center justify-between gap-5 border-b pb-4 last:border-0 last:pb-0"><div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{description}</p></div><Switch checked={checked} onCheckedChange={onChange}/></div> }
function Mini({icon:Icon,label,value}:{icon:typeof Clock3;label:string;value:string}) { return <div className="rounded-xl bg-slate-50 p-3"><Icon className="mb-2 h-4 w-4 text-blue-600"/><p className="text-[11px] text-muted-foreground">{label}</p><p className="text-xs font-semibold">{value}</p></div> }
function Mapping({from,to,detail}:{from:string;to:string;detail:string}) { return <div className="rounded-xl border p-3"><div className="flex items-center gap-2 text-sm font-semibold"><span>{from}</span><ArrowRight className="h-3.5 w-3.5 text-blue-600"/><span>{to}</span></div><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div> }
