"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { formatCurrency } from "@/lib/utils"
import type { SalesPoint } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function LiveSalesChart() {
  const [data, setData] = useState<SalesPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [interval, setInterval] = useState<"5min" | "15min" | "1h">("15min")

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      if (!supabase) { setLoading(false); return }
      const now = new Date()
      const past = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const { data: rawData } = await supabase
        .from("transactions")
        .select("created_at, amount")
        .gte("created_at", past.toISOString())
        .lte("created_at", now.toISOString())
        .eq("status", "completed")
        .order("created_at", { ascending: true })

      if (rawData) {
        const grouped = groupSalesByInterval(rawData, interval)
        setData(grouped)
      }
      setLoading(false)
    }

    fetchData()
  }, [interval])

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return
    const channel = supabase
      .channel("live-chart")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions" },
        (payload: { new: { created_at: string; amount: number } }) => {
          const newTx = payload.new
          setData((prev) => {
            const lastPoint = prev[prev.length - 1]
            if (lastPoint) {
              lastPoint.value += newTx.amount / 100
              lastPoint.cumulative = (lastPoint.cumulative || 0) + newTx.amount / 100
            }
            return [...prev]
          })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const formatDateForGroup = (date: Date, intervalType: string) => {
    const d = new Date(date)
    if (intervalType === "5min") {
      d.setMinutes(Math.floor(d.getMinutes() / 5) * 5, 0, 0)
    } else if (intervalType === "15min") {
      d.setMinutes(Math.floor(d.getMinutes() / 15) * 15, 0, 0)
    } else {
      d.setMinutes(0, 0, 0)
    }
    return d
  }

  const groupSalesByInterval = (
    sales: { created_at: string; amount: number }[],
    intervalType: string,
  ): SalesPoint[] => {
    const groups = new Map<string, number>()
    let cumulative = 0

    for (const sale of sales) {
      const date = formatDateForGroup(new Date(sale.created_at), intervalType)
      const key = date.toISOString()
      groups.set(key, (groups.get(key) || 0) + sale.amount / 100)
    }

    const now = new Date()
    const past = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const points: SalesPoint[] = []

    const step = intervalType === "5min" ? 5 : intervalType === "15min" ? 15 : 60
    for (let d = new Date(past); d <= now; d.setMinutes(d.getMinutes() + step)) {
      const key = formatDateForGroup(d, intervalType).toISOString()
      const value = groups.get(key) || 0
      cumulative += value
      points.push({
        timestamp: d.toISOString(),
        value,
        cumulative,
      })
    }

    return points
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl">
        <p className="text-xs text-zinc-400 mb-1">
          {new Date(label).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </p>
        <p className="text-sm font-semibold text-emerald-400">
          {formatCurrency(payload[0].value)}
        </p>
        {payload[1] && (
          <p className="text-xs text-zinc-400">
            Acumulado: {formatCurrency(payload[1].value)}
          </p>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Vendas ao Vivo</CardTitle>
        <Tabs
          value={interval}
          onValueChange={(v) => setInterval(v as "5min" | "15min" | "1h")}
        >
          <TabsList className="h-8">
            <TabsTrigger value="5min" className="text-xs px-2">5min</TabsTrigger>
            <TabsTrigger value="15min" className="text-xs px-2">15min</TabsTrigger>
            <TabsTrigger value="1h" className="text-xs px-2">1h</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) =>
                    new Date(v).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }
                />
                <YAxis
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#colorCumulative)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#colorValue)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
