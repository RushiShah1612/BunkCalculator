import type { LucideIcon } from "lucide-react"
import { Button } from "../ui/button"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border rounded-2xl bg-card/40 backdrop-blur-sm max-w-md mx-auto my-8 transition-all hover:border-primary/30">
      <div className="p-4 rounded-2xl bg-primary/5 text-primary mb-4 border border-primary/10 shadow-inner">
        <Icon className="w-10 h-10" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
