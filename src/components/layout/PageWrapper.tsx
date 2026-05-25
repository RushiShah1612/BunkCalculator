import React from "react"
import { Navbar } from "./Navbar"

interface PageWrapperProps {
  children: React.ReactNode
  title: string
}

export function PageWrapper({ children, title }: PageWrapperProps) {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Padding left on desktop to clear the 64-width fixed sidebar */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Navbar title={title} />
        
        {/* Main Content Area */}
        {/* pb-20 on mobile to clear the bottom navigation bar */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          {children}
        </main>
      </div>
    </div>
  )
}
