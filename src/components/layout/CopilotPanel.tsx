import { useEffect, useRef, useState } from "react"
import { BarChart3, Bot, Check, GripVertical, Maximize2, Send, ShieldCheck, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createCopilotAgentDraft, type AgentProposal } from "@/lib/agent-config-store"

const MIN_WIDTH = 320
const DEFAULT_WIDTH = 420
const STORAGE_KEY = "agil-ai-copilot-width"

type Message = { id: number; role: "assistant" | "user"; text: string; chart?: boolean; proposal?:AgentProposal; applied?:boolean }

const initialMessages: Message[] = [{
  id: 1,
  role: "assistant",
  text: "Hola, soy tu copiloto. Puedo ayudarte a configurar la plataforma, conectar canales o analizar conversaciones y leads.",
}]

const suggestions = [
  "Crea un agente SDR para restaurantes",
  "¿Cómo conecto WhatsApp?",
  "¿Cuántas conversaciones hubo ayer?",
  "Muéstrame los leads ganados",
]

export function CopilotPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [width, setWidth] = useState(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY))
    return Number.isFinite(stored) && stored >= MIN_WIDTH ? stored : DEFAULT_WIDTH
  })
  const [resizing, setResizing] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!resizing) return
    const move = (event: PointerEvent) => {
      const max = Math.max(MIN_WIDTH, window.innerWidth - 520)
      setWidth(Math.min(Math.max(window.innerWidth - event.clientX, MIN_WIDTH), max))
    }
    const stop = () => setResizing(false)
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", stop, { once: true })
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    return () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", stop)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      localStorage.setItem(STORAGE_KEY, String(width))
    }
  }, [resizing, width])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  useEffect(() => {
    document.documentElement.dataset.copilotOpen = String(open)
    document.documentElement.style.setProperty("--copilot-panel-width", `${open ? width : 0}px`)
    window.dispatchEvent(new CustomEvent("agil-ai:copilot-state", { detail: { open, width } }))
  }, [open, width])

  const send = (value = input) => {
    const question = value.trim()
    if (!question) return
    const lower = question.toLowerCase()
    const forbidden=["código","infraestructura","servidor","deploy","despliegue","variable de entorno","secreto","base de datos"]
    const unsafe=forbidden.some(term=>lower.includes(term))
    const agentIntent=(lower.includes("crear")||lower.includes("configur"))&&(lower.includes("agente")||lower.includes("sdr"))
    const analytics = lower.includes("cuánt") || lower.includes("leads") || lower.includes("conversaciones") || lower.includes("gráfic")
    const proposal:AgentProposal|undefined=agentIntent?{
      name:lower.includes("restaurante")?"Lía SDR Restaurantes":"Nuevo agente SDR",
      industry:lower.includes("restaurante")?"Restaurantes":"General",
      goal:"Filtrar, calificar prospectos según el ICP y agendar una demo. No vender ni negociar.",
      tone:"Cercano, claro, consultivo y breve. Una pregunta a la vez.",
      restrictions:["No vender ni cerrar negocios","No negociar precios ni descuentos","No modificar infraestructura ni secretos","Transferir solicitudes fuera de alcance"],
      icpCriteria:lower.includes("restaurante")?["Cantidad de locales","Órdenes mensuales","Canal de WhatsApp","Proveedor logístico","Tipo de comida","Autoridad de compra","Urgencia"]:["Necesidad","Volumen","Presupuesto","Autoridad","Urgencia"],
      actions:["Crear o actualizar lead","Calcular puntaje ICP","Agendar videollamada","Transferir a una persona"],
    }:undefined
    setMessages((items) => [...items,
      { id: Date.now(), role: "user", text: question },
      unsafe
        ? { id:Date.now()+1,role:"assistant",text:"No puedo modificar código, infraestructura, despliegues, secretos ni datos fuera de tu cuenta. Sí puedo ayudarte a crear y configurar agentes, criterios ICP, embudos y automatizaciones internas." }
        : proposal
        ? { id:Date.now()+1,role:"assistant",text:"Preparé una propuesta de agente dentro de tu cuenta. Revísala: no se aplicará ningún cambio hasta que la autorices.",proposal }
        : analytics
        ? { id: Date.now() + 1, role: "assistant", text: "Ayer se registraron 34 conversaciones nuevas, un 12% más que el día anterior. También se marcaron 8 leads como ganados.", chart: true }
        : { id: Date.now() + 1, role: "assistant", text: "Te guiaré paso a paso. Esta respuesta se conectará con la documentación y el estado real de tu cuenta en la siguiente fase." },
    ])
    setInput("")
  }

  const applyProposal=(messageId:number,proposal:AgentProposal)=>{
    const editingActiveAgent=document.documentElement.dataset.agentStudioOpen==="true"
    if(editingActiveAgent){
      window.dispatchEvent(new CustomEvent("agil-ai:update-active-agent",{detail:proposal}))
      setMessages(items=>items.map(message=>message.id===messageId?{...message,applied:true,text:`Configuración aplicada a “${proposal.name}”. Actualicé su objetivo, datos de calificación, rol, tono y reglas. Revísala antes de guardar o publicar.`}:message))
      return
    }
    const draft=createCopilotAgentDraft(proposal)
    setMessages(items=>items.map(message=>message.id===messageId?{...message,applied:true,text:`Borrador “${draft.name}” creado dentro de tu cuenta. Puedes abrir Agente IA para revisarlo y probarlo antes de publicar.`}:message))
  }

  return (
    <>
      {open && <button className="fixed inset-0 z-30 bg-slate-950/20 lg:hidden" onClick={onClose} aria-label="Cerrar copiloto" />}
      <aside
        style={{ width: open ? width : 0, "--copilot-width": `${width}px` } as React.CSSProperties}
        className={cn(
          "pointer-events-auto relative z-[80] h-screen shrink-0 overflow-visible border-l bg-white transition-[width] duration-200 ease-out",
          resizing && "transition-none",
          "max-lg:fixed max-lg:inset-y-0 max-lg:right-0 max-lg:w-[min(92vw,var(--copilot-width))]! max-lg:shadow-2xl",
          !open && "max-lg:translate-x-full"
        )}
        aria-hidden={!open}
      >
        {open && <>
          <button
            type="button"
            onPointerDown={(event) => { event.preventDefault(); setResizing(true) }}
            className="group absolute inset-y-0 -left-2 z-50 hidden w-4 cursor-col-resize items-center justify-center lg:flex"
            aria-label="Cambiar ancho del copiloto"
          >
            <span className={cn("flex h-12 w-3 items-center justify-center rounded-full border bg-white text-slate-400 shadow-sm transition group-hover:border-blue-300 group-hover:text-blue-600", resizing && "border-blue-400 text-blue-600 shadow-md")}>
              <GripVertical className="h-4 w-4" />
            </span>
          </button>

          <div className="flex h-full min-w-[320px] flex-col">
            <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white shadow-sm"><Sparkles className="h-4 w-4" /></span>
                <div><p className="text-sm font-semibold">Copiloto</p><p className="text-[10px] text-emerald-600">Listo para ayudarte</p></div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWidth(Math.min(window.innerWidth - 520, Math.max(width, 640)))} title="Ampliar panel"><Maximize2 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Cerrar copiloto"><X className="h-4 w-4" /></Button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto bg-slate-50/70 p-4">
              <div className="mx-auto flex max-w-2xl flex-col gap-4">
                {messages.map((message) => <div key={message.id} className={cn("flex gap-2.5", message.role === "user" && "justify-end")}>
                  {message.role === "assistant" && <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700"><Bot className="h-4 w-4" /></span>}
                  <div className={cn("max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 shadow-sm", message.role === "user" ? "rounded-br-md bg-blue-600 text-white" : "rounded-tl-md border bg-white text-slate-700")}>
                    <p>{message.text}</p>
                    {message.chart && <MiniChart />}
                    {message.proposal&&<AgentProposalCard proposal={message.proposal} applied={message.applied??false} onApply={()=>applyProposal(message.id,message.proposal!)}/>} 
                  </div>
                </div>)}
                {messages.length === 1 && <div className="mt-2 space-y-2"><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Prueba preguntando</p>{suggestions.map((suggestion) => <button key={suggestion} onClick={() => send(suggestion)} className="block w-full rounded-xl border bg-white px-3 py-2.5 text-left text-xs text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700">{suggestion}</button>)}</div>}
                <div ref={endRef} />
              </div>
            </div>

            <footer className="shrink-0 border-t bg-white p-3">
              <div className="flex items-end gap-2 rounded-xl border bg-slate-50 p-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send() } }} rows={1} placeholder="Pregunta sobre tu negocio…" className="max-h-28 min-h-8 flex-1 resize-none bg-transparent px-1 py-1.5 text-sm outline-none" />
                <Button size="icon" className="h-8 w-8 shrink-0 rounded-lg" onClick={() => send()} disabled={!input.trim()}><Send className="h-3.5 w-3.5" /></Button>
              </div>
              <p className="mt-2 flex items-center justify-center gap-1 text-center text-[10px] text-slate-400"><ShieldCheck className="h-3 w-3"/>Solo puede modificar configuración interna de tu cuenta</p>
            </footer>
          </div>
        </>}
      </aside>
    </>
  )
}

function AgentProposalCard({proposal,applied,onApply}:{proposal:AgentProposal;applied:boolean;onApply:()=>void}) {
  return <div className="mt-3 overflow-hidden rounded-xl border border-blue-200 bg-white"><div className="border-b bg-blue-50 px-3 py-2"><p className="text-xs font-bold text-blue-900">Propuesta de agente</p><p className="text-[10px] text-blue-700">Borrador · requiere autorización</p></div><div className="space-y-2 p-3 text-[11px]"><ProposalRow label="Nombre" value={proposal.name}/><ProposalRow label="Industria" value={proposal.industry}/><ProposalRow label="Objetivo" value={proposal.goal}/><ProposalRow label="Criterios ICP" value={`${proposal.icpCriteria.length} criterios`}/><ProposalRow label="Acciones" value={proposal.actions.join(", ")}/><div className="rounded-lg bg-emerald-50 p-2 text-[10px] leading-4 text-emerald-800"><ShieldCheck className="mr-1 inline h-3 w-3"/>Alcance limitado a configuración interna. No tiene acceso a código, infraestructura, despliegues ni secretos.</div>{applied?<div className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white"><Check className="h-3.5 w-3.5"/>Aplicado al borrador</div>:<Button size="sm" className="w-full" onClick={onApply}>Autorizar y crear borrador</Button>}</div></div>
}
function ProposalRow({label,value}:{label:string;value:string}) { return <div><span className="font-semibold text-slate-500">{label}</span><p className="mt-0.5 leading-4 text-slate-800">{value}</p></div> }

function MiniChart() {
  const values = [18, 24, 21, 29, 26, 31, 34]
  return <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
    <div className="mb-3 flex items-center justify-between"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><BarChart3 className="h-3.5 w-3.5 text-blue-600" />Conversaciones · 7 días</span><span className="text-[10px] font-semibold text-emerald-600">+12%</span></div>
    <div className="flex h-24 items-end gap-2">{values.map((value, index) => <div key={index} className="flex h-full flex-1 items-end"><div className="w-full rounded-t bg-blue-500/80 transition-all hover:bg-blue-600" style={{ height: `${(value / 34) * 100}%` }} title={`${value} conversaciones`} /></div>)}</div>
    <div className="mt-1.5 flex justify-between text-[9px] text-slate-400"><span>Hace 7 días</span><span>Ayer</span></div>
  </div>
}
