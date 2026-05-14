"use client"

import { Bell, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRealtimeStatus } from "@/hooks/use-realtime-status"

export function Navbar() {
  const { isConnected, salesToday } = useRealtimeStatus()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl px-6">
      <div className="flex-1" />

      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          placeholder="Buscar transações..."
          className="w-72 pl-9 h-9 text-sm"
        />
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm">
        <div
          className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500 live-dot" : "bg-red-500"}`}
        />
        <span className="text-zinc-400 text-xs">
          {isConnected ? "AO VIVO" : "Desconectado"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xs text-zinc-500">Vendas hoje</p>
          <p className="text-sm font-semibold text-zinc-50">{salesToday}</p>
        </div>
      </div>

      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
          3
        </span>
      </Button>
    </header>
  )
}
