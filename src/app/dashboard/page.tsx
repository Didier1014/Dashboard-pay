"use client"

import { useEffect, useState } from "react"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { LiveSalesChart } from "@/components/dashboard/live-sales-chart"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { ConversionFunnel } from "@/components/dashboard/conversion-funnel"
import { createClient } from "@/lib/supabase/client"
import type { KpiData } from "@/types"

export default function DashboardHome() {
  const [kpiData, setKpiData] = useState<KpiData | undefined>()
  const [kpiLoading, setKpiLoading] = useState(true)

  useEffect(() => {
    const fetchKpis = async () => {
      const supabase = createClient()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const yesterday = new Date(today.getTime() - 86400000)
      const tomorrow = new Date(today.getTime() + 86400000)

      const todayStr = today.toISOString()
      const yesterdayStr = yesterday.toISOString()
      const tomorrowStr = tomorrow.toISOString()

      const { data: todaySales } = await supabase
        .from("transactions")
        .select("amount, status")
        .gte("created_at", todayStr)
        .lt("created_at", tomorrowStr)

      const { data: yesterdaySales } = await supabase
        .from("transactions")
        .select("amount, status")
        .gte("created_at", yesterdayStr)
        .lt("created_at", todayStr)

      const todayCompleted = todaySales?.filter((t) => t.status === "completed") || []
      const yesterdayCompleted = yesterdaySales?.filter((t) => t.status === "completed") || []
      const todayFailed = todaySales?.filter((t) => t.status === "failed") || []

      const revenueToday = todayCompleted.reduce((acc, t) => acc + (t.amount || 0), 0)
      const revenueYesterday = yesterdayCompleted.reduce((acc, t) => acc + (t.amount || 0), 0)
      const countToday = todayCompleted.length
      const countYesterday = yesterdayCompleted.length
      const averageTicket = countToday > 0 ? revenueToday / countToday : 0
      const avgTicketYesterday = countYesterday > 0 ? revenueYesterday / countYesterday : 0

      const totalAll = todaySales?.length || 0
      const totalCompleted = todayCompleted.length
      const conversionRate = totalAll > 0 ? totalCompleted / totalAll : 0

      setKpiData({
        revenue_today: revenueToday,
        revenue_yesterday: revenueYesterday,
        sales_count_today: countToday,
        sales_count_yesterday: countYesterday,
        average_ticket: averageTicket,
        average_ticket_yesterday: avgTicketYesterday,
        roas: revenueToday > 0 ? revenueToday / 100 : 0,
        conversion_rate: conversionRate,
        approval_rate: totalAll > 0 ? totalCompleted / totalAll : 0,
        failed_count_today: todayFailed.length,
      })
      setKpiLoading(false)
    }

    fetchKpis()

    const supabase = createClient()
    const channel = supabase
      .channel("kpi-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions" },
        fetchKpis,
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Acompanhe suas vendas ao vivo em tempo real
        </p>
      </div>

      <KpiCards data={kpiData} loading={kpiLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LiveSalesChart />
        </div>
        <div>
          <RecentTransactions />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ConversionFunnel />
        </div>
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold text-zinc-50 mb-4">Resumo Rápido</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Taxa de Conversão", value: kpiData ? `${(kpiData.conversion_rate * 100).toFixed(1)}%` : "-" },
                { label: "Faturamento Hoje", value: kpiData ? `R$ ${(kpiData.revenue_today / 100).toFixed(2)}` : "-" },
                { label: "Vendas Hoje", value: kpiData ? String(kpiData.sales_count_today) : "-" },
                { label: "Ticket Médio", value: kpiData ? `R$ ${(kpiData.average_ticket / 100).toFixed(2)}` : "-" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-zinc-800/50 p-3">
                  <p className="text-xs text-zinc-500">{item.label}</p>
                  <p className="text-lg font-semibold text-zinc-50 mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
