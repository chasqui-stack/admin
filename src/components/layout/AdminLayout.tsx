import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { CopilotPanel } from "./CopilotPanel"

export function AdminLayout() {
  const [copilotOpen, setCopilotOpen] = useState(false)
  useEffect(()=>{const openCopilot=()=>setCopilotOpen(true);window.addEventListener("agil-ai:open-copilot",openCopilot);return()=>window.removeEventListener("agil-ai:open-copilot",openCopilot)},[])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header copilotOpen={copilotOpen} onToggleCopilot={() => setCopilotOpen((open) => !open)} />
        <main className="flex-1 overflow-auto bg-background p-6">
          <Outlet />
        </main>
      </div>
      <CopilotPanel open={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </div>
  )
}
