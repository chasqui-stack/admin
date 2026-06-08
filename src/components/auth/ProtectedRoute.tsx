import { Navigate, useLocation } from "react-router-dom"
import { useAdminAuth } from "@/hooks/useAdminAuth"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const { data: admin, isLoading, isError } = useAdminAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  if (isError || !admin) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
