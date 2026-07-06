import { useEffect, useMemo, useState } from "react"
import { Bot, Check, ChevronLeft, ChevronRight, Plus, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AgentStudioModal } from "@/components/agents/AgentStudioModal"
import { AGENTS_CHANGED_EVENT, listCopilotAgentDrafts } from "@/lib/agent-config-store"

type Agent = { id: number; name: string; industry: string; goal: string; phone: string; color: string; status: string }
const initialAgents: Agent[] = [
  { id: 1, name: "Lía Ventas", industry: "Servicios profesionales", goal: "Calificar y agendar", phone: "+1 ••• ••• 0184", color: "#2563eb", status: "Activo" },
]

const steps = ["Identidad", "Oferta", "Conversación", "Conocimiento", "Equipo", "WhatsApp"]

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>(()=>[...initialAgents,...listCopilotAgentDrafts().map(({id,name,industry,goal,phone,color,status})=>({id,name,industry,goal,phone,color,status}))])
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [studioOpen, setStudioOpen] = useState(false)
  const [selectedAgentId,setSelectedAgentId]=useState<number>(1)
  const [form, setForm] = useState({ name: "", industry: "", goal: "", products: "", tone: "Cercano, claro y consultivo", rules: "", sellers: "Round robin", phone: "", color: "#2563eb" })
  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step])
  useEffect(()=>{const refresh=()=>setAgents([...initialAgents,...listCopilotAgentDrafts().map(({id,name,industry,goal,phone,color,status})=>({id,name,industry,goal,phone,color,status}))]);window.addEventListener(AGENTS_CHANGED_EVENT,refresh);return()=>window.removeEventListener(AGENTS_CHANGED_EVENT,refresh)},[])

  const save = () => {
    if (!form.name.trim()) return toast.error("Dale un nombre al agente")
    setAgents((items) => [...items, { id: Date.now(), name: form.name, industry: form.industry || "General", goal: form.goal || "Ventas", phone: form.phone || "Sin conectar", color: form.color, status: "Borrador" }])
    setOpen(false); setStep(0)
    toast.success("Agente creado. Ya puedes completar sus fuentes y credenciales.")
  }

  return <div className="space-y-8 p-8 lg:p-10">
    <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div><p className="mb-2 text-xs font-bold uppercase tracking-[.22em] text-blue-600">Centro de agentes</p><h1 className="text-4xl font-semibold tracking-[-.04em]">Tu equipo digital, a tu manera.</h1><p className="mt-2 max-w-2xl text-muted-foreground">Cada agente conserva su propio número, catálogo, personalidad, fuentes y equipo comercial.</p></div>
      <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="h-11 bg-blue-600 text-white hover:bg-blue-700"><Plus className="mr-2 h-4 w-4"/>Crear agente</Button></DialogTrigger>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0">
          <DialogHeader className="border-b bg-slate-950 px-7 py-6 text-white"><DialogTitle className="text-2xl">Configurar un nuevo agente</DialogTitle><p className="text-sm text-slate-400">Puedes volver y editar todo más tarde.</p></DialogHeader>
          <div className="px-7 pt-6"><div className="mb-2 flex justify-between text-xs font-medium"><span>{steps[step]}</span><span>{step + 1} de {steps.length}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-blue-600 transition-all" style={{width:`${progress}%`}}/></div></div>
          <div className="min-h-80 space-y-5 px-7 py-7">
            {step === 0 && <><Field label="Nombre del agente"><Input placeholder="Ej. Lía Inmobiliaria" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field><Field label="Industria o rubro"><Input placeholder="Ej. Inmobiliaria, educación, retail…" value={form.industry} onChange={e=>setForm({...form,industry:e.target.value})}/></Field><Field label="Color principal"><div className="flex gap-3"><input aria-label="Color principal" type="color" className="h-10 w-14 rounded border p-1" value={form.color} onChange={e=>setForm({...form,color:e.target.value})}/><Input value={form.color} onChange={e=>setForm({...form,color:e.target.value})}/></div></Field></>}
            {step === 1 && <><Field label="Objetivo comercial"><Input placeholder="Calificar, cotizar, agendar o cerrar ventas" value={form.goal} onChange={e=>setForm({...form,goal:e.target.value})}/></Field><Field label="Productos y servicios"><Textarea rows={7} placeholder="Escribe uno por línea. También podrás importar CSV/Excel o sincronizar tu CRM." value={form.products} onChange={e=>setForm({...form,products:e.target.value})}/></Field><ImportHint text="Importar catálogo CSV o Excel"/></>}
            {step === 2 && <><Field label="Tono y personalidad"><Textarea rows={4} value={form.tone} onChange={e=>setForm({...form,tone:e.target.value})}/></Field><Field label="Reglas de calificación y transferencia"><Textarea rows={6} placeholder="Ej. pedir nombre, ciudad y presupuesto; transferir si solicita hablar con una persona…" value={form.rules} onChange={e=>setForm({...form,rules:e.target.value})}/></Field></>}
            {step === 3 && <><div className="rounded-xl border border-dashed border-blue-300 bg-blue-50/60 p-8 text-center"><Upload className="mx-auto mb-3 h-7 w-7 text-blue-600"/><h3 className="font-semibold">Añade conocimiento continuamente</h3><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">PDF, DOCX, TXT, enlaces web, FAQ o texto libre. Cada fuente se procesa y queda aislada para este agente.</p><Button variant="outline" className="mt-4">Seleccionar archivos</Button></div><p className="text-xs text-muted-foreground">El agente consulta estas fuentes mediante RAG; no se reentrena el modelo ni se mezclan datos entre empresas.</p></>}
            {step === 4 && <><Field label="Asignación de vendedores"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.sellers} onChange={e=>setForm({...form,sellers:e.target.value})}><option>Round robin</option><option>Manual</option><option>Por especialidad</option></select></Field><div className="rounded-xl border p-5"><p className="font-medium">Roles incluidos</p><p className="mt-2 text-sm text-muted-foreground">Propietario · Administrador · Supervisor · Vendedor</p></div></>}
            {step === 5 && <><Field label="Número de WhatsApp"><Input placeholder="Conéctalo ahora o déjalo para después" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></Field><div className="grid gap-3 sm:grid-cols-2"><Status title="Azure OpenAI" text="Se configura de forma segura por entorno"/><Status title="CRM por API" text="Listo para API key y endpoint"/></div><div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900"><Check className="mr-2 inline h-4 w-4"/>Un agente utiliza un número; una organización puede conectar varios.</div></>}
          </div>
          <div className="flex justify-between border-t px-7 py-5"><Button variant="ghost" disabled={step===0} onClick={()=>setStep(s=>s-1)}><ChevronLeft className="mr-1 h-4 w-4"/>Atrás</Button>{step<steps.length-1?<Button onClick={()=>setStep(s=>s+1)}>Continuar<ChevronRight className="ml-1 h-4 w-4"/></Button>:<Button className="bg-blue-600 text-white" onClick={save}>Crear agente</Button>}</div>
        </DialogContent></Dialog>
    </header>
    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{agents.map(agent=><Card key={agent.id} className="group overflow-hidden border-0 shadow-[0_8px_30px_rgba(15,23,42,.08)]"><div className="h-1.5" style={{background:agent.color}}/><CardHeader><div className="flex items-start justify-between"><div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{background:agent.color}}><Bot/></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{agent.status}</span></div><CardTitle className="pt-4 text-xl">{agent.name}</CardTitle><p className="text-sm text-muted-foreground">{agent.industry}</p></CardHeader><CardContent><div className="space-y-3 border-t pt-4 text-sm"><Row label="Objetivo" value={agent.goal}/><Row label="WhatsApp" value={agent.phone}/><Row label="Asignación" value="Round robin"/></div><Button variant="outline" className="mt-5 w-full" onClick={()=>{setSelectedAgentId(agent.id);setStudioOpen(true)}}>Configurar Agente IA</Button></CardContent></Card>)}</section>
    <AgentStudioModal open={studioOpen} onOpenChange={setStudioOpen} agentName={agents.find(agent=>agent.id===selectedAgentId)?.name}/>
  </div>
}

function Field({label,children}:{label:string;children:React.ReactNode}) { return <div className="space-y-2"><Label>{label}</Label>{children}</div> }
function Row({label,value}:{label:string;value:string}) { return <div className="flex justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium">{value}</span></div> }
function Status({title,text}:{title:string;text:string}) { return <div className="rounded-xl border p-4"><div className="flex items-center justify-between"><b className="text-sm">{title}</b><X className="h-4 w-4 text-slate-400"/></div><p className="mt-2 text-xs text-muted-foreground">{text}</p></div> }
function ImportHint({text}:{text:string}) { return <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-sm font-medium text-blue-700 hover:bg-blue-50"><Upload className="h-4 w-4"/>{text}</button> }
