interface LoadingSpinnerProps {
  fullPage?: boolean
  message?: string
}

export function LoadingSpinner({
  fullPage = false,
  message = "Loading...",
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative w-16 h-16">
        {/* Glowing track */}
        <div className="absolute inset-0 rounded-full border-4 border-primary/10 animate-pulse"></div>
        {/* Spinning gradient arc */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary/70 animate-spin"></div>
      </div>
      {message && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {message}
        </p>
      )}
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md">
        {spinner}
      </div>
    )
  }

  return <div className="flex items-center justify-center p-8">{spinner}</div>
}
