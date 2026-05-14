"use client"

import { useState } from "react"
import { ErrorBoundary } from "@/components/shared/error-boundary"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen">
        <Sidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />
        <div
          className="flex flex-1 flex-col transition-all duration-300"
          style={{ marginLeft: sidebarCollapsed ? "4rem" : "15rem" }}
        >
          <Navbar />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
