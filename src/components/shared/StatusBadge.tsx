import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  isActive: boolean
  className?: string
}

export function StatusBadge({ isActive, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-normal",
        isActive
          ? "border-success/30 bg-success/10 text-success"
          : "border-muted-foreground/30 bg-muted text-muted-foreground",
        className
      )}
    >
      {isActive ? "Activo" : "Inactivo"}
    </Badge>
  )
}
