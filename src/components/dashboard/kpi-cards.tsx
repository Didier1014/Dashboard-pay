"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, calculateVariation } from "@/lib/utils"
import type { KpiData } from "@/types"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Target, BarChart3 } from "lucide-react"

interface KpiCardsProps {
  data?: KpiData
  loading?: boolean
}

const kpis = [
  {
    key: "revenue_today",
    label: "Faturamento Hoje",
    icon: DollarSign,
    format: (v: number) => formatCurrency(v / 100),
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
  {
    key: "sales_count_today",
    label: "Vendas Hoje",
    icon: ShoppingCart,
    format: (v: number) => String(v),
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-500/10",
    iconColor: "text-purple-400",
  },
  {
    key: "average_ticket",
    label: "Ticket Médio",
    icon: Target,
    format: (v: number) => formatCurrency(v / 100),
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500/10",
    iconColor: "text-blue-400",
  },
  {
    key: "roas",
    label: "ROAS",
    icon: BarChart3,
    format: (v: number) => `R$ ${v.toFixed(2)}`,
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-500/10",
    iconColor: "text-orange-400",
  },
] as const

export function KpiCards({ data, loading }: KpiCardsProps) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const current = data[kpi.key as keyof KpiData] as number
        const yesterdayKey = kpi.key.replace("_today", "_yesterday") as keyof KpiData
        const yesterday = data[yesterdayKey] as number | undefined
        const variation = yesterday !== undefined ? calculateVariation(current, yesterday) : 0

        return (
          <Card key={kpi.key}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-zinc-400">{kpi.label}</p>
                  <p className="text-2xl font-bold text-zinc-50 number-flow">
                    {kpi.format(current)}
                  </p>
                  {yesterday !== undefined && (
                    <div className="flex items-center gap-1.5">
                      {variation >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      )}
                      <span
                        className={`text-xs ${
                          variation >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {variation >= 0 ? "+" : ""}
                        {variation.toFixed(1)}%
                      </span>
                      <span className="text-xs text-zinc-600">vs ontem</span>
                    </div>
                  )}
                </div>
                <div className={`rounded-lg ${kpi.bgColor} p-2.5`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
