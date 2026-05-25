import { Button } from "../ui/button"

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: "default" | "destructive"
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {description}
        </p>
        <div className="flex justify-end space-x-3">
          <Button 
            variant="ghost" 
            onClick={onCancel}
            className="hover:bg-accent"
          >
            {cancelLabel}
          </Button>
          <Button 
            variant={variant} 
            onClick={onConfirm}
            className="shadow-md"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
