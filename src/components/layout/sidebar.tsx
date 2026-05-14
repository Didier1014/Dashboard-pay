"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  History,
  TrendingUp,
  CreditCard,
  ShoppingCart,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const menuItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/transacoes", icon: History, label: "Transações" },
  { href: "/dashboard/taxa-conversao", icon: TrendingUp, label: "Taxa de Conversão" },
  { href: "/dashboard/pagamentos", icon: CreditCard, label: "Pagamentos" },
  { href: "/dashboard/checkout-creator", icon: ShoppingCart, label: "Criar Checkout" },
]

interface SidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

export function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-zinc-800 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-purple-600">
          <Wallet className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
            PayFlow
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-zinc-800 p-2">
        <Link
          href="/dashboard/configuracoes"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-all duration-200 hover:bg-zinc-800 hover:text-zinc-50",
          )}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Configurações</span>}
        </Link>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400"
        onClick={() => onCollapse(!collapsed)}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>
    </aside>
  )
}
