import { useState, useEffect } from "react"
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
  confirmTextMatch?: string
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
  confirmTextMatch,
}: ConfirmDialogProps) {
  const [matchInput, setMatchInput] = useState("")

  // Reset input when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setMatchInput("")
    }
  }, [isOpen])

  if (!isOpen) return null

  const isConfirmDisabled = confirmTextMatch ? matchInput !== confirmTextMatch : false

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {description}
        </p>

        {confirmTextMatch && (
          <div className="mb-6">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 pl-1">
              Type <span className="font-bold text-foreground">"{confirmTextMatch}"</span> to confirm:
            </label>
            <input
              type="text"
              value={matchInput}
              onChange={(e) => setMatchInput(e.target.value)}
              placeholder={`Type "${confirmTextMatch}"`}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-danger/50 focus:border-danger/50 transition-all"
            />
          </div>
        )}

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
            disabled={isConfirmDisabled}
            className="shadow-md"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
