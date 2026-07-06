import { Navigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAdminAuth } from "@/hooks/useAdminAuth"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const { data: admin, isLoading, isError } = useAdminAuth()

  // Local product preview only. Production always requires a valid JWT.
  if (import.meta.env.DEV) return <>{children}</>

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">{t("common.loading")}</div>
      </div>
    )
  }

  if (isError || !admin) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
