import { useEffect, useState } from "react"
import {
  Building2, CalendarClock, Check, ChevronRight, CircleDollarSign, Clock3,
  FileText, GripVertical, Mail, MapPin, MessageCircle, MoreHorizontal, Pencil,
  Info, Phone, Plus, Settings2, Sparkles, Store, Trash2, Truck, UserRound, Utensils, X,
} from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type Chat = { id:string; name:string; phone:string; preview:string; time:string; unread:number; owner:string; mode:"agent"|"human"; labels:string[] }
type Stage = { id:string; name:string; color:string; guidance:string }
type CustomField = { id:string; label:string; value:string }
type IcpRange = { id:string; min:number; max:number|null; points:number }
type IcpRule = { id:string; label:string; description:string; weight:number; fit:number; responseType:"number"|"yes_no"|"text"; ranges?:IcpRange[] }
type IcpAnswer = { value:string; fit:number; source:"Bot"|"SDR"|"Archivo"|"Integración" }

const defaultIcpRules: IcpRule[] = [
  { id:"locations", label:"Cantidad de locales", description:"Número de locales activos", weight:20, fit:1, responseType:"number", ranges:[{id:"loc-1",min:1,max:1,points:15},{id:"loc-2",min:2,max:2,points:18},{id:"loc-3",min:3,max:null,points:20}] },
  { id:"orders", label:"Volumen de órdenes", description:"Órdenes mensuales", weight:20, fit:1, responseType:"number", ranges:[{id:"ord-1",min:0,max:499,points:5},{id:"ord-2",min:500,max:999,points:15},{id:"ord-3",min:1000,max:null,points:20}] },
  { id:"whatsapp", label:"Canal de WhatsApp", description:"Ya vende o quiere abrir el canal", weight:15, fit:1, responseType:"yes_no" },
  { id:"urgency", label:"Urgencia", description:"Plazo deseado de implementación", weight:15, fit:1, responseType:"text" },
  { id:"authority", label:"Autoridad de compra", description:"Nombre o rol del decisor", weight:15, fit:.5, responseType:"text" },
  { id:"logistics", label:"Operación logística", description:"Proveedor o modalidad de reparto", weight:10, fit:1, responseType:"text" },
  { id:"menu", label:"Carta disponible", description:"Adjuntó PDF, imagen o Excel de su carta", weight:5, fit:1, responseType:"yes_no" },
]

const stages: Stage[] = [
  { id:"new", name:"Lead nuevo", color:"#0ea5e9", guidance:"Validar datos básicos" },
  { id:"contacted", name:"Primer contacto", color:"#6366f1", guidance:"Lograr respuesta" },
  { id:"qualifying", name:"En calificación", color:"#8b5cf6", guidance:"Completar ficha ICP" },
  { id:"validated", name:"ICP validado", color:"#f59e0b", guidance:"Confirmar oportunidad" },
  { id:"scheduling", name:"Demo por agendar", color:"#f97316", guidance:"Proponer horarios" },
  { id:"scheduled", name:"Demo agendada", color:"#10b981", guidance:"Preparar brief" },
]

const PIPELINE_STORAGE_KEY = "agil-ai-sdr-pipeline-positions-v1"

function loadPipelinePositions(chats:Chat[]) {
  try {
    const saved=JSON.parse(localStorage.getItem(PIPELINE_STORAGE_KEY)??"{}") as Record<string,string>
    const validStages=new Set(stages.map(stage=>stage.id))
    return Object.fromEntries(chats.map((chat,index)=>[
      chat.id,
      validStages.has(saved[chat.id])?saved[chat.id]:(index===1?"qualifying":"new"),
    ]))
  } catch {
    return Object.fromEntries(chats.map((chat,index)=>[chat.id,index===1?"qualifying":"new"]))
  }
}

export function SdrPipelineView({ chats }: { chats: Chat[] }) {
  const [positions,setPositions] = useState<Record<string,string>>(()=>loadPipelinePositions(chats))
  const [dragging,setDragging] = useState<string|null>(null)
  const [overStage,setOverStage] = useState<string|null>(null)
  const [selected,setSelected] = useState<Chat|null>(null)
  const [configOpen,setConfigOpen] = useState(false)
  const [icpRules,setIcpRules] = useState<IcpRule[]>(defaultIcpRules)
  const [qualifiedThreshold,setQualifiedThreshold] = useState(70)
  const icpScore=calculateIcp(icpRules)
  useEffect(()=>{
    setPositions(current=>{
      const saved=loadPipelinePositions(chats)
      const next={...saved,...current}
      localStorage.setItem(PIPELINE_STORAGE_KEY,JSON.stringify(next))
      return next
    })
  },[chats])
  const moveLead = (leadId:string,stageId:string) => {
    setPositions(items=>{
      const next={...items,[leadId]:stageId}
      localStorage.setItem(PIPELINE_STORAGE_KEY,JSON.stringify(next))
      return next
    })
    const lead=chats.find(chat=>chat.id===leadId)
    const stage=stages.find(item=>item.id===stageId)
    toast.success(`${lead?.name} pasó a ${stage?.name}`)
  }

  return <div className="relative min-h-0 flex-1 overflow-auto bg-[#f3f5f8] p-5">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="text-xl font-semibold text-slate-900">Pipeline SDR</h2><p className="text-xs text-slate-500">Arrastra cada lead entre etapas o abre su ficha para calificarlo. <span className="font-medium text-emerald-600">Los cambios se guardan automáticamente.</span></p></div>
      <div className="flex gap-2"><Button variant="outline" onClick={()=>setConfigOpen(true)}><Settings2 className="mr-2 h-4 w-4"/>Configurar ICP</Button><Button><Plus className="mr-2 h-4 w-4"/>Nuevo lead</Button></div>
    </div>
    <div className="flex min-w-max gap-3 pb-5">{stages.map(stage=>{
      const stageChats=chats.filter(chat=>(positions[chat.id]??"new")===stage.id)
      return <section key={stage.id} onDragOver={event=>{event.preventDefault();setOverStage(stage.id)}} onDragLeave={()=>setOverStage(null)} onDrop={event=>{event.preventDefault();const id=event.dataTransfer.getData("text/plain");if(id)moveLead(id,stage.id);setDragging(null);setOverStage(null)}} className={cn("w-72 rounded-lg border bg-slate-50 transition",overStage===stage.id&&"border-blue-400 bg-blue-50 ring-2 ring-blue-100")}>
        <header className="border-b bg-white px-3 py-3"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{background:stage.color}}/><p className="min-w-0 flex-1 truncate text-sm font-semibold">{stage.name}</p><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{stageChats.length}</span><MoreHorizontal className="h-4 w-4 text-slate-400"/></div><p className="mt-1 pl-4 text-[10px] text-slate-400">{stage.guidance}</p></header>
        <div className="min-h-[510px] space-y-3 p-3">{stageChats.map(chat=><article key={chat.id} draggable onDragStart={event=>{setDragging(chat.id);event.dataTransfer.setData("text/plain",chat.id);event.dataTransfer.effectAllowed="move"}} onDragEnd={()=>{setDragging(null);setOverStage(null)}} onClick={()=>{if(!dragging)setSelected(chat)}} className={cn("group cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md",dragging===chat.id&&"opacity-40")}>
          <div className="flex items-start gap-2"><GripVertical className="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-slate-300 group-hover:text-blue-500"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{chat.name}</p><p className="mt-0.5 truncate text-[11px] text-slate-500">La Esquina · Restaurante</p></div><span className="text-[10px] text-slate-400">{chat.time}</span></div>
          <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-600">{chat.preview}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-500"><span className="flex items-center gap-1"><Store className="h-3 w-3"/>3 locales</span><span className="flex items-center gap-1"><MessageCircle className="h-3 w-3"/>WhatsApp activo</span></div>
          <div className="mt-3 flex items-center justify-between border-t pt-2"><span className="flex items-center gap-1 text-[10px] font-medium text-blue-700"><UserRound className="h-3 w-3"/>{chat.owner}</span><IcpBadge score={icpScore} rules={icpRules} threshold={qualifiedThreshold}/></div>
        </article>)}</div>
      </section>})}</div>
    {selected&&<LeadRecordDrawer lead={selected} stageId={positions[selected.id]??"new"} icpRules={icpRules} threshold={qualifiedThreshold} onStageChange={stageId=>moveLead(selected.id,stageId)} onClose={()=>setSelected(null)}/>} 
    <IcpConfigDialog open={configOpen} onOpenChange={setConfigOpen} rules={icpRules} onRulesChange={setIcpRules} threshold={qualifiedThreshold} onThresholdChange={setQualifiedThreshold}/>
  </div>
}

function LeadRecordDrawer({lead,stageId,icpRules,threshold,onStageChange,onClose}:{lead:Chat;stageId:string;icpRules:IcpRule[];threshold:number;onStageChange:(id:string)=>void;onClose:()=>void}) {
  const [tab,setTab]=useState<"activity"|"details"|"icp"|"related">("details")
  const [fields,setFields]=useState<CustomField[]>([{id:"transport",label:"Transporte",value:"Propio, Rappi"},{id:"orders",label:"Órdenes mensuales",value:"1,200"},{id:"whatsapp",label:"Ventas por WhatsApp",value:"Sí, canal activo"}])
  const [icpAnswers,setIcpAnswers]=useState<Record<string,IcpAnswer>>(()=>loadIcpAnswers(lead.id,icpRules))
  const current=stages.findIndex(stage=>stage.id===stageId)
  const completion=Math.round(((current+1)/stages.length)*100)
  const assessedRules=icpRules.map(rule=>({...rule,fit:fitForAnswer(rule,icpAnswers[rule.id]?.value??"")}))
  const icpScore=calculateIcp(assessedRules)
  const addField=()=>setFields(items=>[...items,{id:String(Date.now()),label:"Nuevo campo",value:"Haz clic para completar"}])
  useEffect(()=>{localStorage.setItem(`agil-ai-icp-answers-${lead.id}`,JSON.stringify(icpAnswers))},[icpAnswers,lead.id])

  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/25" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
    <aside className="flex h-full w-full max-w-[940px] flex-col overflow-hidden border-l bg-[#f3f5f8] shadow-2xl">
      <div className="shrink-0 border-b bg-white">
        <div className="flex items-start justify-between gap-4 px-5 py-4">
          <div className="flex min-w-0 gap-3"><Avatar className="h-11 w-11"><AvatarFallback className="bg-blue-600 font-semibold text-white">{lead.name.slice(0,2).toUpperCase()}</AvatarFallback></Avatar><div className="min-w-0"><p className="text-[11px] text-slate-500">Lead · Restaurante</p><h2 className="truncate text-xl font-semibold text-slate-900">{lead.name}</h2></div></div>
          <div className="flex shrink-0 gap-2"><Button variant="outline" size="sm"><Pencil className="mr-2 h-3.5 w-3.5"/>Editar</Button><Button size="sm"><CalendarClock className="mr-2 h-3.5 w-3.5"/>Agendar demo</Button><Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5"/></Button></div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t px-5 py-3 sm:grid-cols-4">
          <Highlight label="Marca" value="La Esquina"/><Highlight label="Responsable" value={lead.owner}/><IcpHighlight score={icpScore} rules={assessedRules} threshold={threshold}/><Highlight label="Próxima acción" value="Agendar discovery"/>
        </div>
      </div>

      <div className="shrink-0 border-b bg-white px-5 py-4">
        <div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold text-slate-700">Proceso de calificación SDR</p><span className="text-[11px] font-semibold text-blue-700">{completion}% completado</span></div>
        <div className="flex overflow-x-auto rounded-md">{stages.map((stage,index)=>{
          const done=index<current,active=index===current
          return <button key={stage.id} onClick={()=>onStageChange(stage.id)} className={cn("group relative flex h-9 min-w-[135px] flex-1 items-center justify-center border-y border-r px-4 text-[11px] font-semibold transition first:rounded-l-md first:border-l last:rounded-r-md",done&&"border-emerald-600 bg-emerald-600 text-white",active&&"border-blue-600 bg-blue-600 text-white",!done&&!active&&"bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-700")}><span className="truncate">{done&&<Check className="mr-1 inline h-3 w-3"/>}{stage.name}</span>{index<stages.length-1&&<ChevronRight className="absolute -right-2 z-10 h-4 w-4 rounded-full bg-white text-slate-300"/>}</button>})}</div>
      </div>

      <div className="flex min-h-0 flex-1 gap-4 overflow-y-auto p-4">
        <main className="min-w-0 flex-1">
          <div className="rounded-lg border bg-white shadow-sm"><div className="flex overflow-x-auto border-b px-4"><Tab active={tab==="activity"} onClick={()=>setTab("activity")}>Actividad</Tab><Tab active={tab==="details"} onClick={()=>setTab("details")}>Detalles</Tab><Tab active={tab==="icp"} onClick={()=>setTab("icp")}>Calificación ICP</Tab><Tab active={tab==="related"} onClick={()=>setTab("related")}>Relacionados</Tab></div>
            {tab==="details"&&<div className="p-5"><SectionTitle title="Información del negocio" action={<Button variant="ghost" size="sm" onClick={addField}><Plus className="mr-1 h-3.5 w-3.5"/>Agregar campo</Button>}/><div className="grid gap-x-8 sm:grid-cols-2"><Field icon={Building2} label="Nombre de la marca" value="La Esquina"/><Field icon={Utensils} label="Tipo de comida" value="Hamburguesas y comida rápida"/><Field icon={Store} label="Cantidad de locales" value="3"/><Field icon={MapPin} label="Ciudad" value="Miami, FL"/>{fields.map(field=><EditableField key={field.id} field={field} onChange={value=>setFields(items=>items.map(item=>item.id===field.id?{...item,value}:item))}/>)}</div><SectionTitle title="Calificación comercial"/><div className="grid gap-x-8 sm:grid-cols-2"><Field icon={CircleDollarSign} label="Ticket promedio" value="$24"/><Field icon={Clock3} label="Urgencia" value="Implementar en 30 días"/><Field icon={Sparkles} label="Ajuste al ICP" value={`${icpScore>=threshold?"Alto":"Revisar"} · ${icpScore} puntos`}/><Field icon={UserRound} label="Autoridad de compra" value="Dueño / decisor"/></div><SectionTitle title="Archivos"/><button className="flex w-full items-center gap-3 rounded-lg border border-dashed p-3 text-left hover:border-blue-300 hover:bg-blue-50/50"><span className="grid h-9 w-9 place-items-center rounded bg-red-50 text-red-600"><FileText className="h-4 w-4"/></span><div><p className="text-xs font-semibold">menu-la-esquina.pdf</p><p className="text-[10px] text-slate-400">Carta · PDF · 2.4 MB</p></div></button></div>}
            {tab==="activity"&&<ActivityTimeline lead={lead}/>} 
            {tab==="icp"&&<IcpQualification rules={icpRules} answers={icpAnswers} threshold={threshold} onChange={setIcpAnswers}/>} 
            {tab==="related"&&<div className="p-5"><SectionTitle title="Registros relacionados"/><Related label="Conversaciones" value="4"/><Related label="Archivos" value="1"/><Related label="Tareas abiertas" value="2"/></div>}
          </div>
        </main>
        <aside className="hidden w-72 shrink-0 space-y-4 lg:block"><div className="rounded-lg border bg-white p-4 shadow-sm"><SectionTitle title="Contacto"/><p className="text-sm font-semibold">{lead.name}</p><p className="mt-1 flex items-center gap-2 text-xs text-slate-500"><Phone className="h-3.5 w-3.5"/>{lead.phone}</p><p className="mt-2 flex items-center gap-2 text-xs text-slate-500"><Mail className="h-3.5 w-3.5"/>contacto@laesquina.demo</p><Button variant="outline" size="sm" className="mt-4 w-full"><MessageCircle className="mr-2 h-3.5 w-3.5"/>Abrir conversación</Button></div><div className="rounded-lg border bg-white p-4 shadow-sm"><SectionTitle title="Resumen con IA"/><p className="text-xs leading-5 text-slate-600">Restaurante con tres locales y alto volumen. Ya vende por WhatsApp, pero gestiona pedidos manualmente. Buen ajuste al ICP y urgencia clara.</p><Button variant="ghost" size="sm" className="mt-2 px-0 text-blue-700"><Sparkles className="mr-2 h-3.5 w-3.5"/>Actualizar resumen</Button></div></aside>
      </div>
    </aside>
  </div>
}

function Highlight({label,value,accent=false}:{label:string;value:string;accent?:boolean}) { return <div className="min-w-0"><p className="text-[10px] text-slate-500">{label}</p><p className={cn("truncate text-xs font-semibold",accent&&"text-emerald-700")}>{value}</p></div> }
function calculateIcp(rules:IcpRule[]) { const total=rules.reduce((sum,rule)=>sum+rule.weight,0); if(!total)return 0; return Math.round(rules.reduce((sum,rule)=>sum+(rule.weight*rule.fit),0)/total*100) }
function fitForAnswer(rule:IcpRule,value:string) { if(!value.trim())return 0; if(rule.responseType==="number"){const number=Number(value.replace(/[^0-9.-]/g,""));if(!Number.isFinite(number))return 0;const range=rule.ranges?.find(item=>number>=item.min&&(item.max===null||number<=item.max));return range?Math.min(range.points,rule.weight)/Math.max(rule.weight,1):0} if(rule.responseType==="yes_no")return value.toLowerCase()==="sí"||value.toLowerCase()==="si"?1:0;return 1 }
function IcpBadge({score,rules,threshold}:{score:number;rules:IcpRule[];threshold:number}) { return <div className="group/icp relative" onClick={event=>event.stopPropagation()}><button aria-label={`Puntaje ICP ${score} de 100. Ver criterios`} className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold outline-none ring-offset-2 focus:ring-2",score>=threshold?"bg-emerald-50 text-emerald-700 focus:ring-emerald-400":"bg-amber-50 text-amber-700 focus:ring-amber-400")}>ICP {score}</button><IcpBreakdown score={score} rules={rules} threshold={threshold} className="bottom-full right-0 mb-2 hidden group-hover/icp:block group-focus-within/icp:block"/></div> }
function IcpHighlight({score,rules,threshold}:{score:number;rules:IcpRule[];threshold:number}) { return <div className="group/icp relative min-w-0"><p className="flex items-center gap-1 text-[10px] text-slate-500">Puntuación ICP <Info className="h-3 w-3"/></p><button className={cn("text-xs font-bold outline-none",score>=threshold?"text-emerald-700":"text-amber-700")}>{score} / 100</button><IcpBreakdown score={score} rules={rules} threshold={threshold} className="left-0 top-full mt-2 hidden group-hover/icp:block group-focus-within/icp:block"/></div> }
function IcpBreakdown({score,rules,threshold,className}:{score:number;rules:IcpRule[];threshold:number;className?:string}) { return <div role="tooltip" className={cn("absolute z-[70] w-80 rounded-xl border bg-white p-4 text-left shadow-xl",className)}><div className="mb-3 flex items-start justify-between"><div><p className="text-xs font-bold text-slate-900">Cómo se calcula el ICP</p><p className="mt-0.5 text-[10px] font-normal text-slate-500">Umbral para calificar: {threshold} puntos</p></div><span className={cn("rounded-full px-2 py-1 text-[10px] font-bold",score>=threshold?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700")}>{score}/100</span></div><div className="space-y-2.5">{rules.map(rule=>{const earned=Math.round(rule.weight*rule.fit);return <div key={rule.id}><div className="flex items-center justify-between gap-3"><span className="text-[11px] font-semibold text-slate-700">{rule.label}</span><span className={cn("text-[10px] font-bold",rule.fit===1?"text-emerald-600":rule.fit>0?"text-amber-600":"text-slate-400")}>+{earned}/{rule.weight}</span></div><p className="mt-0.5 text-[9px] font-normal leading-4 text-slate-400">{rule.description}</p></div>})}</div><div className="mt-3 border-t pt-2 text-[9px] font-normal text-slate-400">El puntaje se normaliza a 100 aunque cambies los pesos.</div></div> }
function loadIcpAnswers(leadId:string,rules:IcpRule[]) {
  try { const saved=JSON.parse(localStorage.getItem(`agil-ai-icp-answers-${leadId}`)??"null") as Record<string,IcpAnswer>|null; if(saved)return saved } catch { /* use demo defaults */ }
  const samples:Record<string,string>={locations:"3",orders:"1200",whatsapp:"Sí",urgency:"Implementar en 30 días",authority:"Contacto influenciador; falta validar decisor",logistics:"Reparto propio y Rappi",menu:"Sí"}
  return Object.fromEntries(rules.map(rule=>[rule.id,{value:samples[rule.id]??"",fit:rule.fit,source:rule.id==="menu"?"Archivo":rule.id==="authority"?"SDR":"Bot"}])) as Record<string,IcpAnswer>
}
function IcpQualification({rules,answers,threshold,onChange}:{rules:IcpRule[];answers:Record<string,IcpAnswer>;threshold:number;onChange:(answers:Record<string,IcpAnswer>)=>void}) {
  const [decision,setDecision]=useState("Requiere más información")
  const assessed=rules.map(rule=>({...rule,fit:fitForAnswer(rule,answers[rule.id]?.value??"")}))
  const score=calculateIcp(assessed)
  const answered=rules.filter(rule=>answers[rule.id]?.value.trim()).length
  const progress=rules.length?Math.round(answered/rules.length*100):0
  const update=(id:string,changes:Partial<IcpAnswer>)=>{
    const current=answers[id]??{value:"",fit:0,source:"SDR" as const}
    onChange({...answers,[id]:{...current,...changes}})
  }
  return <div className="p-5"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border bg-slate-50 p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Puntaje actual</p><p className={cn("mt-1 text-2xl font-bold",score>=threshold?"text-emerald-600":"text-amber-600")}>{score}<span className="text-sm text-slate-400">/100</span></p><p className="mt-1 text-[10px] text-slate-500">Umbral: {threshold} puntos</p></div><div className="rounded-xl border bg-slate-50 p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Completitud</p><p className="mt-1 text-2xl font-bold text-slate-800">{answered}<span className="text-sm text-slate-400">/{rules.length}</span></p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-600" style={{width:`${progress}%`}}/></div></div><div className="rounded-xl border bg-slate-50 p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Estado</p><p className={cn("mt-1 text-sm font-bold",score>=threshold?"text-emerald-700":"text-amber-700")}>{score>=threshold?"Buen ajuste al ICP":"Requiere validación"}</p><p className="mt-2 text-[10px] text-slate-500">Guardado automático activo</p></div></div>
    <div className="mt-5"><SectionTitle title="Criterios de calificación"/>{rules.length===0?<p className="rounded-lg border border-dashed p-8 text-center text-sm text-slate-500">Configura criterios ICP para comenzar la calificación.</p>:<div className="space-y-3">{rules.map(rule=>{const answer=answers[rule.id]??{value:"",fit:0,source:"SDR"};const fit=fitForAnswer(rule,answer.value);const earned=Math.round(rule.weight*fit);return <div key={rule.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-800">{rule.label}</p><p className="mt-0.5 text-xs text-slate-500">{rule.description}</p></div><span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold",fit===1?"bg-emerald-50 text-emerald-700":fit>0?"bg-amber-50 text-amber-700":"bg-slate-100 text-slate-500")}>+{earned} de {rule.weight} pts · automático</span></div><div className="mt-3 grid gap-2 sm:grid-cols-[1fr_115px]">{rule.responseType==="yes_no"?<select value={answer.value} onChange={event=>update(rule.id,{value:event.target.value})} className="h-9 rounded-md border bg-white px-3 text-xs"><option value="">Selecciona una respuesta</option><option value="Sí">Sí</option><option value="No">No</option></select>:<Input type={rule.responseType==="number"?"number":"text"} value={answer.value} onChange={event=>update(rule.id,{value:event.target.value})} placeholder={rule.responseType==="number"?"Ingresa un número":"Escribe la respuesta recopilada"} className="h-9 text-xs"/>}<select value={answer.source} onChange={event=>update(rule.id,{source:event.target.value as IcpAnswer["source"]})} className="h-9 rounded-md border bg-white px-2 text-xs"><option>Bot</option><option>SDR</option><option>Archivo</option><option>Integración</option></select></div></div>})}</div>}</div>
    <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4"><SectionTitle title="Decisión de calificación"/><div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-1 block text-[10px] font-semibold text-slate-500">Resultado del SDR</span><select value={decision} onChange={event=>setDecision(event.target.value)} className="h-9 w-full rounded-md border bg-white px-3 text-xs"><option>Califica para demo</option><option>Requiere más información</option><option>No califica</option></select></label><label><span className="mb-1 block text-[10px] font-semibold text-slate-500">Próxima acción</span><Input defaultValue="Validar autoridad de compra" className="h-9 bg-white text-xs"/></label></div><label className="mt-3 block"><span className="mb-1 block text-[10px] font-semibold text-slate-500">Comentario del SDR</span><textarea rows={2} className="w-full resize-none rounded-md border bg-white px-3 py-2 text-xs outline-none focus:border-blue-400" placeholder="Registra contexto, objeciones o información pendiente…"/></label></div>
  </div>
}
function RangeEditor({rule,onChange}:{rule:IcpRule;onChange:(ranges:IcpRange[])=>void}) { const ranges=rule.ranges??[];const updateRange=(id:string,changes:Partial<IcpRange>)=>onChange(ranges.map(range=>range.id===id?{...range,...changes}:range));return <div className="ml-10 mt-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3"><div className="mb-2 flex items-center justify-between"><div><p className="text-xs font-semibold text-blue-900">Rangos de puntuación</p><p className="text-[10px] text-blue-700">Los rangos deben ser consecutivos y no superponerse.</p></div><Button type="button" variant="outline" size="sm" onClick={()=>onChange([...ranges,{id:`range-${Date.now()}`,min:0,max:null,points:rule.weight}])}><Plus className="mr-1 h-3.5 w-3.5"/>Agregar rango</Button></div>{ranges.length===0?<p className="rounded border border-dashed border-blue-200 p-4 text-center text-xs text-blue-600">Agrega al menos un rango para otorgar puntos.</p>:<div className="space-y-2">{ranges.map((range,index)=><div key={range.id} className="grid grid-cols-[24px_1fr_1fr_1fr_34px] items-end gap-2 rounded-md bg-white p-2"><span className="mb-2 text-center text-[10px] font-bold text-slate-400">{index+1}</span><label><span className="mb-1 block text-[9px] text-slate-500">Desde</span><Input type="number" value={range.min} onChange={event=>updateRange(range.id,{min:Number(event.target.value)})} className="h-8 text-xs"/></label><label><span className="mb-1 block text-[9px] text-slate-500">Hasta</span><Input type="number" value={range.max??""} onChange={event=>updateRange(range.id,{max:event.target.value===""?null:Number(event.target.value)})} placeholder="Sin límite" className="h-8 text-xs"/></label><label><span className="mb-1 block text-[9px] text-slate-500">Puntos</span><Input type="number" min={0} max={rule.weight} value={range.points} onChange={event=>updateRange(range.id,{points:Math.min(rule.weight,Math.max(0,Number(event.target.value)))})} className="h-8 text-xs"/></label><Button type="button" variant="ghost" size="icon" onClick={()=>onChange(ranges.filter(item=>item.id!==range.id))} className="h-8 w-8 text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5"/></Button></div>)}</div>}</div> }
function IcpConfigDialog({open,onOpenChange,rules,onRulesChange,threshold,onThresholdChange}:{open:boolean;onOpenChange:(open:boolean)=>void;rules:IcpRule[];onRulesChange:(rules:IcpRule[])=>void;threshold:number;onThresholdChange:(value:number)=>void}) {
  const total=rules.reduce((sum,rule)=>sum+rule.weight,0)
  const update=(id:string,changes:Partial<IcpRule>)=>onRulesChange(rules.map(rule=>rule.id===id?{...rule,...changes}:rule))
  const add=()=>onRulesChange([...rules,{id:`custom-${Date.now()}`,label:"Nuevo criterio",description:"Define la pregunta que responderá el agente",weight:10,fit:0,responseType:"text"}])
  const remove=(id:string)=>onRulesChange(rules.filter(rule=>rule.id!==id))
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>Configuración del puntaje ICP</DialogTitle><DialogDescription>Crea criterios propios para cualquier industria, define sus condiciones y asigna cuánto aporta cada uno.</DialogDescription></DialogHeader>
    <div className="rounded-lg border bg-slate-50 p-4"><label className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold">Umbral de lead calificado</p><p className="text-xs text-slate-500">A partir de este puntaje se considera buen ajuste al ICP.</p></div><div className="flex items-center gap-2"><Input type="number" min={0} max={100} value={threshold} onChange={event=>onThresholdChange(Math.min(100,Math.max(0,Number(event.target.value))))} className="w-20 text-right"/><span className="text-xs text-slate-500">pts</span></div></label></div>
    <div className="space-y-2"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Criterios personalizados</p><p className="mt-0.5 text-[10px] text-slate-400">Peso total actual: {total} · el cálculo se normaliza a 100</p></div><Button variant="outline" size="sm" onClick={add}><Plus className="mr-1.5 h-3.5 w-3.5"/>Agregar criterio</Button></div>
      {rules.length===0&&<div className="rounded-lg border border-dashed p-8 text-center"><p className="text-sm font-semibold text-slate-600">No hay criterios configurados</p><p className="mt-1 text-xs text-slate-400">Agrega la primera señal que define a tu cliente ideal.</p><Button size="sm" className="mt-3" onClick={add}><Plus className="mr-1.5 h-3.5 w-3.5"/>Crear criterio</Button></div>}
      {rules.map((rule,index)=><div key={rule.id} className="rounded-lg border bg-white p-3"><div className="grid gap-3 sm:grid-cols-[28px_1fr_1.3fr_120px_76px_36px]"><span className="mt-7 grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">{index+1}</span><label><span className="mb-1 block text-[10px] font-semibold text-slate-500">Nombre del criterio</span><Input value={rule.label} onChange={event=>update(rule.id,{label:event.target.value})} className="h-9 text-xs" placeholder="Ej. Cantidad de sucursales"/></label><label><span className="mb-1 block text-[10px] font-semibold text-slate-500">Pregunta para el agente</span><Input value={rule.description} onChange={event=>update(rule.id,{description:event.target.value})} className="h-9 text-xs" placeholder="Ej. ¿Cuántos locales tiene?"/></label><label><span className="mb-1 block text-[10px] font-semibold text-slate-500">Tipo de respuesta</span><select value={rule.responseType} onChange={event=>update(rule.id,{responseType:event.target.value as IcpRule["responseType"],ranges:event.target.value==="number"?(rule.ranges??[]):undefined})} className="h-9 w-full rounded-md border bg-white px-2 text-xs"><option value="text">Texto</option><option value="yes_no">Sí / No</option><option value="number">Número con rangos</option></select></label><label><span className="mb-1 block text-[10px] font-semibold text-slate-500">Máx.</span><Input type="number" min={0} max={100} value={rule.weight} onChange={event=>update(rule.id,{weight:Math.max(0,Number(event.target.value))})} className="h-9 text-right"/></label><Button variant="ghost" size="icon" onClick={()=>remove(rule.id)} className="mt-5 h-9 w-9 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Eliminar ${rule.label}`}><Trash2 className="h-4 w-4"/></Button></div>{rule.responseType==="number"&&<RangeEditor rule={rule} onChange={ranges=>update(rule.id,{ranges})}/>}</div>)}
    </div>
    <div className="flex items-center justify-between gap-4 border-t pt-4"><p className="max-w-md text-[10px] leading-4 text-slate-500">Cada criterio podrá vincularse después con un campo y operador estructurado —igual, contiene, mayor que o rango— para calcularse automáticamente con datos reales.</p><Button onClick={()=>{onOpenChange(false);toast.success("Configuración ICP guardada")}}>Guardar configuración</Button></div>
  </DialogContent></Dialog>
}
function Tab({active,onClick,children}:{active:boolean;onClick:()=>void;children:React.ReactNode}) { return <button onClick={onClick} className={cn("relative px-4 py-3 text-xs font-semibold",active?"text-blue-700":"text-slate-500 hover:text-slate-800")}>{children}{active&&<span className="absolute inset-x-3 bottom-0 h-0.5 bg-blue-600"/>}</button> }
function SectionTitle({title,action}:{title:string;action?:React.ReactNode}) { return <div className="mb-2 mt-2 flex items-center justify-between border-b pb-2"><h3 className="text-xs font-bold text-slate-700">{title}</h3>{action}</div> }
function Field({icon:Icon,label,value}:{icon:typeof Building2;label:string;value:string}) { return <div className="group flex min-h-16 items-start gap-3 border-b py-3"><Icon className="mt-1 h-3.5 w-3.5 text-slate-400"/><div className="min-w-0 flex-1"><p className="text-[10px] text-slate-500">{label}</p><p className="mt-0.5 text-xs font-medium text-slate-800">{value}</p></div><Pencil className="mt-1 h-3 w-3 text-transparent group-hover:text-slate-400"/></div> }
function EditableField({field,onChange}:{field:CustomField;onChange:(value:string)=>void}) { const [editing,setEditing]=useState(false); return <div className="group flex min-h-16 items-start gap-3 border-b py-3"><Truck className="mt-1 h-3.5 w-3.5 text-slate-400"/><div className="min-w-0 flex-1"><p className="text-[10px] text-slate-500">{field.label}</p>{editing?<Input autoFocus value={field.value} onChange={event=>onChange(event.target.value)} onBlur={()=>setEditing(false)} onKeyDown={event=>event.key==="Enter"&&setEditing(false)} className="mt-1 h-7 text-xs"/>:<button onClick={()=>setEditing(true)} className="mt-0.5 text-left text-xs font-medium text-slate-800">{field.value}</button>}</div><Pencil className="mt-1 h-3 w-3 text-transparent group-hover:text-slate-400"/></div> }
function ActivityTimeline({lead}:{lead:Chat}) { return <div className="p-5"><SectionTitle title="Línea de actividad"/><div className="space-y-0">{[{icon:MessageCircle,title:"Conversación de WhatsApp",detail:lead.preview,time:"Hoy · 10:42"},{icon:Phone,title:"Primer contacto realizado",detail:"El lead respondió y confirmó interés.",time:"Hoy · 10:38"},{icon:Store,title:"Lead creado",detail:"Capturado automáticamente por el agente.",time:"Ayer · 18:20"}].map((item,index)=><div key={item.title} className="relative flex gap-3 pb-5"><div className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border bg-white text-blue-600"><item.icon className="h-3.5 w-3.5"/></div>{index<2&&<span className="absolute left-4 top-8 h-[calc(100%-2rem)] w-px bg-slate-200"/>}<div><p className="text-xs font-semibold">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.detail}</p><p className="mt-1 text-[10px] text-slate-400">{item.time}</p></div></div>)}</div></div> }
function Related({label,value}:{label:string;value:string}) { return <button className="flex w-full items-center justify-between border-b py-3 text-xs hover:text-blue-700"><span>{label}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold">{value}</span></button> }
