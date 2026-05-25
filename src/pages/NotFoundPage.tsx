import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Compass } from "lucide-react"

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse"></div>

      <div className="p-5 rounded-2xl bg-primary/5 text-primary mb-6 border border-primary/10 shadow-inner">
        <Compass className="w-12 h-12 animate-spin duration-1000" style={{ animationDuration: "10s" }} />
      </div>
      
      <h2 className="text-5xl font-black text-foreground tracking-tight mb-2">
        404
      </h2>
      <h3 className="text-xl font-bold text-foreground mb-3">
        Page Not Found
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-8 leading-relaxed">
        The route you are trying to access does not exist or has been relocated.
      </p>
      
      <Link to="/">
        <Button className="rounded-xl shadow-lg shadow-primary/10 px-6 py-2.5 h-11 text-sm font-semibold hover:-translate-y-0.5 transition-transform">
          Back to Dashboard
        </Button>
      </Link>
    </div>
  )
}
