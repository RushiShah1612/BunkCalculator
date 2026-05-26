import { useState, useEffect, useRef, useCallback } from "react"
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
  const modalRef = useRef<HTMLDivElement>(null)

  const handleCancel = useCallback(() => {
    setMatchInput("")
    onCancel()
  }, [onCancel])

  const handleConfirm = useCallback(() => {
    setMatchInput("")
    onConfirm()
  }, [onConfirm])

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCancel()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, handleCancel])

  // Trap focus
  useEffect(() => {
    if (!isOpen) return
    const modal = modalRef.current
    if (!modal) return

    const focusables = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusables.length > 0) {
      // Focus the input if it exists, otherwise the cancel button (safer default than confirm)
      const target = confirmTextMatch && focusables[0] instanceof HTMLInputElement ? focusables[0] : focusables[0]
      target.focus()
    }

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return

      const focusables = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === last) {
          first.focus()
          e.preventDefault()
        }
      }
    }

    window.addEventListener("keydown", handleTab)
    return () => window.removeEventListener("keydown", handleTab)
  }, [isOpen, confirmTextMatch])

  if (!isOpen) return null

  const isConfirmDisabled = confirmTextMatch ? matchInput !== confirmTextMatch : false

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <h3 id="confirm-dialog-title" className="text-xl font-bold text-foreground mb-2">{title}</h3>
        <p id="confirm-dialog-desc" className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {description}
        </p>

        {confirmTextMatch && (
          <div className="mb-6">
            <label 
              htmlFor="confirm-text-input"
              className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 pl-1"
            >
              Type <span className="font-bold text-foreground">"{confirmTextMatch}"</span> to confirm:
            </label>
            <input
              id="confirm-text-input"
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
            onClick={handleCancel}
            className="hover:bg-accent"
          >
            {cancelLabel}
          </Button>
          <Button 
            variant={variant} 
            onClick={handleConfirm}
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
