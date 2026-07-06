export type AgentDraft = {
  id: number
  name: string
  industry: string
  goal: string
  phone: string
  color: string
  status: "Borrador"
  tone: string
  restrictions: string[]
  icpCriteria: string[]
  actions: string[]
  createdBy: "copilot" | "form"
}

export type AgentProposal = Omit<AgentDraft,"id"|"status"|"createdBy"|"phone"|"color"> & {
  phone?: string
  color?: string
}

const ACCOUNT_SCOPE="current"
const STORAGE_KEY=`agil-ai:account:${ACCOUNT_SCOPE}:agent-drafts-v1`
export const AGENTS_CHANGED_EVENT="agil-ai:agents-changed"

const clean=(value:string,max=500)=>value.replace(/[<>]/g,"").trim().slice(0,max)
const cleanList=(items:string[],maxItems=20)=>items.slice(0,maxItems).map(item=>clean(item,180)).filter(Boolean)

export function sanitizeAgentProposal(input:AgentProposal):AgentProposal {
  return {
    name:clean(input.name,80)||"Nuevo agente",
    industry:clean(input.industry,100)||"General",
    goal:clean(input.goal,300),
    tone:clean(input.tone,300),
    restrictions:cleanList(input.restrictions),
    icpCriteria:cleanList(input.icpCriteria),
    actions:cleanList(input.actions),
    phone:clean(input.phone??"",40)||"Sin conectar",
    color:/^#[0-9a-f]{6}$/i.test(input.color??"")?input.color:"#2563eb",
  }
}

export function listCopilotAgentDrafts():AgentDraft[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)??"[]") as AgentDraft[] } catch { return [] }
}

export function createCopilotAgentDraft(proposal:AgentProposal):AgentDraft {
  const safe=sanitizeAgentProposal(proposal)
  const draft:AgentDraft={...safe,id:Date.now(),status:"Borrador",createdBy:"copilot",phone:safe.phone??"Sin conectar",color:safe.color??"#2563eb"}
  localStorage.setItem(STORAGE_KEY,JSON.stringify([...listCopilotAgentDrafts(),draft]))
  window.dispatchEvent(new CustomEvent(AGENTS_CHANGED_EVENT))
  return draft
}

// Intentional capability boundary: this module exports no filesystem,
// infrastructure, secret, deployment, network, or cross-account operations.
