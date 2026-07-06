import { useMemo, useState } from "react"
import { Check, ChevronDown, Mail, MoreHorizontal, Plus, Send, ShieldCheck, Trash2, UserCheck, UserX, Users } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

type Role = "Propietario" | "Administrador" | "Supervisor" | "Vendedor"
type Member = { id:number; name:string; email:string; role:Role; agents:string[]; status:"Activo"|"Invitado"|"Suspendido" }
// Members come from the authenticated organization. Never seed real-looking
// people here: the first registered account becomes that tenant's owner.
const initialMembers: Member[] = []

const rolePermissions: Record<Role,string[]> = {
  Propietario:["Acceso total", "Facturación", "Usuarios y seguridad", "Todos los agentes"],
  Administrador:["Configurar agentes", "Gestionar equipo", "Ver todas las conversaciones", "Integraciones"],
  Supervisor:["Ver conversaciones del equipo", "Asignar chats", "Ver reportes", "Editar etiquetas"],
  Vendedor:["Ver chats asignados", "Responder", "Gestionar sus leads", "Añadir etiquetas"],
}

export function UsersPage() {
  const [members,setMembers] = useState(initialMembers)
  const [open,setOpen] = useState(false)
  const [form,setForm] = useState<{name:string;email:string;role:Role;allAgents:boolean}>({name:"",email:"",role:"Vendedor",allAgents:false})
  const [selected,setSelected] = useState<Member|null>(null)
  const [editRole,setEditRole] = useState<Role>("Vendedor")
  const [editAllAgents,setEditAllAgents] = useState(false)
  const active = members.filter(m=>m.status==="Activo").length
  const invite = () => {
    if (form.name.trim().length < 2) return toast.error("Introduce el nombre completo")
    if (!form.email.includes("@")) return toast.error("Introduce un correo válido")
    setMembers(items=>[...items,{id:Date.now(),name:form.name.trim(),email:form.email,role:form.role,agents:form.allAgents?["Todos"]:["Lía Ventas"],status:"Invitado"}])
    setOpen(false); setForm({name:"",email:"",role:"Vendedor",allAgents:false}); toast.success(`Invitación preparada para ${form.name.trim()}`)
  }
  const permissions = useMemo(()=>rolePermissions[form.role],[form.role])
  const openManage = (member:Member) => { setSelected(member); setEditRole(member.role); setEditAllAgents(member.agents.includes("Todos")) }
  const updateMember = () => {
    if (!selected) return
    setMembers(items=>items.map(item=>item.id===selected.id?{...item,role:editRole,agents:editAllAgents?["Todos"]:["Lía Ventas"]}:item))
    setSelected(null); toast.success("Permisos actualizados")
  }
  const toggleSuspension = () => {
    if (!selected || selected.role==="Propietario") return
    const next = selected.status==="Suspendido"?"Activo":"Suspendido"
    setMembers(items=>items.map(item=>item.id===selected.id?{...item,status:next}:item)); setSelected(null); toast.success(next==="Suspendido"?"Usuario suspendido":"Usuario reactivado")
  }
  const removeMember = () => {
    if (!selected || selected.role==="Propietario") return
    setMembers(items=>items.filter(item=>item.id!==selected.id)); setSelected(null); toast.success("Usuario retirado del equipo")
  }

  return <div className="mx-auto max-w-7xl space-y-8 p-8 lg:p-10">
    <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.22em] text-blue-600">Administración</p><h1 className="text-4xl font-semibold tracking-[-.04em]">Equipo y permisos</h1><p className="mt-2 max-w-2xl text-muted-foreground">Controla quién entra, qué agentes puede ver y qué acciones puede realizar.</p></div>
      <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="bg-blue-600 text-white hover:bg-blue-700"><Plus className="mr-2 h-4 w-4"/>Invitar usuario</Button></DialogTrigger><DialogContent className="max-w-xl p-0"><DialogHeader className="border-b bg-slate-950 px-6 py-5 text-white"><DialogTitle>Invitar al equipo</DialogTitle><p className="text-sm text-slate-400">El acceso comienza cuando la persona acepta la invitación.</p></DialogHeader><div className="space-y-5 p-6"><div className="grid gap-4 sm:grid-cols-2"><Field label="Nombre completo"><Input autoFocus placeholder="Ej. María Soto" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field><Field label="Correo electrónico"><Input type="email" placeholder="persona@empresa.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></Field></div><Field label="Rol"><select className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={form.role} onChange={e=>setForm({...form,role:e.target.value as Role})}>{Object.keys(rolePermissions).map(role=><option key={role}>{role}</option>)}</select></Field><div className="rounded-xl bg-slate-50 p-4"><div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-semibold">Acceso a todos los agentes</p><p className="text-xs text-muted-foreground">Si está apagado, se limita a los seleccionados.</p></div><Switch checked={form.allAgents} onCheckedChange={v=>setForm({...form,allAgents:v})}/></div>{!form.allAgents&&<label className="flex items-center gap-2 rounded-lg border bg-white p-3 text-sm"><input type="checkbox" defaultChecked/> Lía Ventas</label>}</div><div><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Permisos incluidos</p><div className="grid gap-2 sm:grid-cols-2">{permissions.map(item=><span key={item} className="flex items-center gap-2 text-xs"><Check className="h-3.5 w-3.5 text-emerald-600"/>{item}</span>)}</div></div><Button onClick={invite} className="w-full bg-blue-600 text-white">Enviar invitación</Button></div></DialogContent></Dialog>
    </header>

    <div className="grid gap-4 sm:grid-cols-3"><Metric icon={Users} value={String(members.length)} label="Miembros totales"/><Metric icon={UserCheck} value={String(active)} label="Usuarios activos"/><Metric icon={ShieldCheck} value="4" label="Roles disponibles"/></div>

    {members.length===0&&<div className="flex flex-col items-center rounded-2xl border border-dashed bg-white px-6 py-10 text-center"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Users className="h-5 w-5"/></div><h2 className="mt-4 font-semibold">Aún no hay miembros cargados</h2><p className="mt-1 max-w-lg text-sm text-muted-foreground">En producción, tu cuenta aparecerá aquí como propietario de la organización. Los nombres de demostración fueron eliminados.</p><Button className="mt-5" onClick={()=>setOpen(true)}><Plus className="mr-2 h-4 w-4"/>Invitar primer usuario</Button></div>}

    <Card className="overflow-hidden border-0 shadow-[0_8px_30px_rgba(15,23,42,.08)]"><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-6 py-4">Usuario</th><th className="px-6 py-4">Rol</th><th className="px-6 py-4">Agentes</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4 text-right">Acciones</th></tr></thead><tbody>{members.map(member=><tr key={member.id} className="border-b last:border-0 hover:bg-slate-50/60"><td className="px-6 py-4"><div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarFallback className="bg-blue-50 text-xs font-bold text-blue-700">{member.name.slice(0,2).toUpperCase()}</AvatarFallback></Avatar><div><p className="font-semibold capitalize">{member.name}</p><p className="text-xs text-muted-foreground">{member.email}</p></div></div></td><td className="px-6 py-4"><Badge variant="outline">{member.role}</Badge></td><td className="px-6 py-4">{member.agents.join(", ")}</td><td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${member.status==="Activo"?"text-emerald-700":member.status==="Suspendido"?"text-red-700":"text-amber-700"}`}><span className={`h-1.5 w-1.5 rounded-full ${member.status==="Activo"?"bg-emerald-500":member.status==="Suspendido"?"bg-red-500":"bg-amber-500"}`}/>{member.status}</span></td><td className="px-6 py-4 text-right"><Button variant="ghost" size="sm" onClick={()=>openManage(member)}>Gestionar <ChevronDown className="ml-1 h-3.5 w-3.5"/></Button></td></tr>)}</tbody></table></div></CardContent></Card>

    <Dialog open={!!selected} onOpenChange={value=>!value&&setSelected(null)}><DialogContent className="max-w-xl p-0">{selected&&<><DialogHeader className="border-b bg-slate-950 px-6 py-5 text-white"><DialogTitle>Gestionar usuario</DialogTitle><p className="text-sm text-slate-400">{selected.name} · {selected.email}</p></DialogHeader><div className="space-y-5 p-6"><Field label="Rol"><select className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={editRole} onChange={e=>setEditRole(e.target.value as Role)} disabled={selected.role==="Propietario"}>{Object.keys(rolePermissions).map(role=><option key={role} disabled={role==="Propietario"&&selected.role!=="Propietario"}>{role}</option>)}</select></Field><div className="rounded-xl bg-slate-50 p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">Todos los agentes</p><p className="text-xs text-muted-foreground">Permite ver conversaciones de cualquier agente.</p></div><Switch checked={editAllAgents} onCheckedChange={setEditAllAgents} disabled={selected.role==="Propietario"}/></div>{!editAllAgents&&<label className="mt-3 flex items-center gap-2 rounded-lg border bg-white p-3 text-sm"><input type="checkbox" defaultChecked/> Lía Ventas</label>}</div><div><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Permisos resultantes</p><div className="grid gap-2 sm:grid-cols-2">{rolePermissions[editRole].map(item=><span key={item} className="flex items-center gap-2 text-xs"><Check className="h-3.5 w-3.5 text-emerald-600"/>{item}</span>)}</div></div><Button onClick={updateMember} className="w-full bg-blue-600 text-white">Guardar permisos</Button>{selected.status==="Invitado"&&<Button variant="outline" className="w-full" onClick={()=>toast.success("Invitación reenviada")}><Send className="mr-2 h-4 w-4"/>Reenviar invitación</Button>}{selected.role!=="Propietario"&&<div className="grid gap-3 border-t pt-5 sm:grid-cols-2"><Button variant="outline" onClick={toggleSuspension}><UserX className="mr-2 h-4 w-4"/>{selected.status==="Suspendido"?"Reactivar":"Suspender"}</Button><Button variant="outline" className="text-red-600 hover:text-red-700" onClick={removeMember}><Trash2 className="mr-2 h-4 w-4"/>Retirar usuario</Button></div>}{selected.role==="Propietario"&&<p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">El propietario principal no puede suspenderse ni eliminarse. Primero debe transferir la propiedad.</p>}</div></>}</DialogContent></Dialog>

    <div className="grid gap-4 lg:grid-cols-4">{(Object.entries(rolePermissions) as [Role,string[]][]).map(([role,items])=><div key={role} className="rounded-2xl border bg-white p-5"><div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">{role}</h3><MoreHorizontal className="h-4 w-4 text-slate-400"/></div><div className="space-y-2">{items.map(item=><p key={item} className="flex gap-2 text-xs text-muted-foreground"><Check className="h-3.5 w-3.5 shrink-0 text-blue-600"/>{item}</p>)}</div></div>)}</div>
    <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-950"><Mail className="h-5 w-5 shrink-0 text-blue-600"/><p><b>Recomendación:</b> aplica mínimo privilegio. Los vendedores ven solo conversaciones asignadas; supervisores ven su equipo; administradores configuran; únicamente el propietario gestiona facturación y seguridad crítica.</p></div>
  </div>
}

function Field({label,children}:{label:string;children:React.ReactNode}) { return <div className="space-y-2"><Label>{label}</Label>{children}</div> }
function Metric({icon:Icon,value,label}:{icon:typeof Users;value:string;label:string}) { return <div className="flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm"><div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-white"><Icon className="h-5 w-5"/></div><div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></div> }
