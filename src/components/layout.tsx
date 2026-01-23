"use client"

import { SidebarComponent } from "@/components/sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AuthProvider } from "@/components/auth-provider"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <AuthProvider>
      <SidebarProvider className="scrollbar-hide">

        {/* Sidebar */}
        <SidebarComponent />

        {/* Main Content */}
        <div className="flex-1 flex flex-col p-3.5 pl-0 bg-sidebar overflow-y-hidden max-h-screen h-screen max-w-screen w-screen scrollbar-hide ">
          <div className="border border-border bg-background rounded-md overflow-y-auto scrollbar-hide max-h-screen h-screen ">
            {children}
          </div>
        </div>

      </SidebarProvider>
    </AuthProvider>
  )
} 