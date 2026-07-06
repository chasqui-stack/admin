import { useState } from "react"
import { Check, ChevronLeft, ChevronRight, Copy, ExternalLink, Eye, EyeOff, KeyRound, MessageCircle, PlugZap, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const steps = ["Cuenta Meta", "Credenciales", "Webhook", "Prueba"]

export function MetaSetupPanel() {
  const [step, setStep] = useState(0)
  const [showSecrets, setShowSecrets] = useState(false)
  const [testing, setTesting] = useState(false)
  const [form, setForm] = useState({ appId:"", appSecret:"", wabaId:"", phoneId:"", token:"", verifyToken:"", agent:"Lía Ventas" })
  const callbackUrl = "https://whatsapp.agil.ai/webhook/meta"
  const set = (key:keyof typeof form, value:string) => setForm(f=>({...f,[key]:value}))
  const test = () => {
    if (!form.appId || !form.wabaId || !form.phoneId || !form.token) return toast.error("Completa las credenciales obligatorias")
    setTesting(true); window.setTimeout(()=>{setTesting(false);toast.info("La prueba real quedará disponible al conectar el backend de credenciales")},700)
  }

  return <Card className="overflow-hidden border-0 shadow-[0_8px_30px_rgba(15,23,42,.08)]">
    <CardHeader className="border-b bg-[#0b1324] text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div className="flex gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#25D366] text-[#07150c]"><MessageCircle className="h-5 w-5"/></div><div><CardTitle className="text-xl">Meta WhatsApp Cloud API</CardTitle><p className="mt-1 text-sm text-slate-400">Vincula un número oficial a un agente de agil.ai.</p></div></div><span className="w-fit rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">Sin conectar</span></div>
    </CardHeader>
    <CardContent className="p-0">
      <div className="grid lg:grid-cols-[220px_1fr]">
        <aside className="border-r bg-slate-50 p-5">{steps.map((name,index)=><div key={name} className="relative flex gap-3 pb-7 last:pb-0"><div className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${index===step?"bg-blue-600 text-white":index<step?"bg-emerald-500 text-white":"border bg-white text-slate-500"}`}>{index<step?<Check className="h-3.5 w-3.5"/>:index+1}</div>{index<steps.length-1&&<span className="absolute left-3.5 top-7 h-7 w-px bg-slate-200"/>}<div><p className={`text-sm font-semibold ${index===step?"text-blue-700":"text-slate-700"}`}>{name}</p><p className="mt-0.5 text-[11px] text-slate-500">{["Crear app Business","Copiar IDs y token","Recibir mensajes","Validar el número"][index]}</p></div></div>)}</aside>
        <div className="min-h-[390px] p-6 lg:p-8">
          {step===0&&<div className="space-y-5"><StepTitle icon={PlugZap} title="Prepara tu cuenta de Meta" text="Este proceso se realiza una vez por cada número de WhatsApp."/><Checklist items={["Entra en Meta for Developers y crea una app de tipo Business.","Añade el producto WhatsApp a la app.","Selecciona o crea una cuenta de WhatsApp Business (WABA).","Registra y verifica el número que usará este agente."]}/><a href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-semibold text-blue-700 hover:underline">Abrir Meta for Developers <ExternalLink className="ml-2 h-4 w-4"/></a><p className="rounded-xl bg-amber-50 p-4 text-xs text-amber-900">Un número solo puede estar asignado a un agente activo. Para otro agente, registra otro número.</p></div>}
          {step===1&&<div className="space-y-5"><StepTitle icon={KeyRound} title="Ingresa las credenciales" text="Las encontrarás en WhatsApp → Configuración de API y Configuración básica de la app."/><div className="grid gap-4 sm:grid-cols-2"><Field label="App ID *"><Input value={form.appId} onChange={e=>set("appId",e.target.value)} placeholder="123456789…"/></Field><Field label="App Secret"><Secret value={form.appSecret} show={showSecrets} onChange={v=>set("appSecret",v)}/></Field><Field label="WhatsApp Business Account ID *"><Input value={form.wabaId} onChange={e=>set("wabaId",e.target.value)} placeholder="WABA ID"/></Field><Field label="Phone Number ID *"><Input value={form.phoneId} onChange={e=>set("phoneId",e.target.value)} placeholder="Phone number ID"/></Field></div><Field label="Token permanente *"><Secret value={form.token} show={showSecrets} onChange={v=>set("token",v)}/></Field><button onClick={()=>setShowSecrets(v=>!v)} className="flex items-center gap-2 text-xs font-semibold text-slate-600">{showSecrets?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}{showSecrets?"Ocultar credenciales":"Mostrar credenciales"}</button><div className="flex gap-2 rounded-xl bg-emerald-50 p-4 text-xs text-emerald-900"><ShieldCheck className="h-4 w-4 shrink-0"/><span>En producción los secretos se cifran en el servidor. Nunca se vuelven a mostrar completos ni se guardan en el navegador.</span></div></div>}
          {step===2&&<div className="space-y-5"><StepTitle icon={PlugZap} title="Configura el webhook" text="Meta utilizará esta dirección para entregar mensajes y eventos."/><Field label="URL de callback"><div className="flex gap-2"><Input readOnly value={callbackUrl}/><Button variant="outline" size="icon" onClick={()=>navigator.clipboard.writeText(callbackUrl).then(()=>toast.success("URL copiada"))}><Copy className="h-4 w-4"/></Button></div></Field><Field label="Verify token"><Input value={form.verifyToken} onChange={e=>set("verifyToken",e.target.value)} placeholder="Crea una frase secreta larga"/></Field><Checklist items={["En Meta abre WhatsApp → Configuración.","Edita Webhook e introduce la URL y el verify token.","Suscríbete al campo messages.","Guarda y espera la confirmación de Meta."]}/></div>}
          {step===3&&<div className="space-y-5"><StepTitle icon={MessageCircle} title="Asigna y prueba el número" text="Envía un mensaje real antes de activar el agente."/><Field label="Agente asignado"><select className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={form.agent} onChange={e=>set("agent",e.target.value)}><option>Lía Ventas</option><option>Crear agente después</option></select></Field><div className="rounded-xl border p-4"><p className="text-sm font-semibold">Prueba recomendada</p><ol className="mt-3 space-y-2 text-xs text-muted-foreground"><li>1. Envía “Hola” desde un teléfono autorizado.</li><li>2. Confirma que aparece una conversación nueva.</li><li>3. Responde desde agil.ai y valida la entrega.</li><li>4. Activa el agente cuando ambos sentidos funcionen.</li></ol></div><Button onClick={test} disabled={testing} className="bg-[#128C4A] text-white hover:bg-[#0f783f]">{testing?"Comprobando…":"Probar conexión"}</Button></div>}
          <div className="mt-8 flex justify-between border-t pt-5"><Button variant="ghost" disabled={step===0} onClick={()=>setStep(s=>s-1)}><ChevronLeft className="mr-1 h-4 w-4"/>Atrás</Button>{step<3&&<Button onClick={()=>setStep(s=>s+1)}>Continuar<ChevronRight className="ml-1 h-4 w-4"/></Button>}</div>
        </div>
      </div>
    </CardContent>
  </Card>
}

function StepTitle({icon:Icon,title,text}:{icon:typeof PlugZap;title:string;text:string}) { return <div className="flex gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5"/></div><div><h3 className="text-lg font-semibold">{title}</h3><p className="text-sm text-muted-foreground">{text}</p></div></div> }
function Checklist({items}:{items:string[]}) { return <div className="space-y-3">{items.map(item=><div key={item} className="flex gap-3 text-sm"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check className="h-3 w-3"/></span><span>{item}</span></div>)}</div> }
function Field({label,children}:{label:string;children:React.ReactNode}) { return <div className="space-y-2"><Label>{label}</Label>{children}</div> }
function Secret({value,show,onChange}:{value:string;show:boolean;onChange:(value:string)=>void}) { return <Input type={show?"text":"password"} value={value} onChange={e=>onChange(e.target.value)} placeholder="••••••••••••••••" autoComplete="off"/> }
