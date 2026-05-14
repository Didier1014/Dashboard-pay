"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import type { FailureReason } from "@/types"

const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"]

export function FailurePieChart() {
  const [data, setData] = useState<FailureReason[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFailures = async () => {
      const supabase = createClient()
      if (!supabase) { setLoading(false); return }
      const { data: failures } = await supabase
        .from("transactions")
        .select("failure_reason")
        .not("failure_reason", "is", null)
        .neq("failure_reason", "")

      if (failures) {
        type FailureRow = { failure_reason: string | null }
        const rows = failures as FailureRow[]
        const grouped: Record<string, number> = rows.reduce((acc, curr) => {
          const reason = curr.failure_reason || "Outro"
          acc[reason] = (acc[reason] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const total = Object.values(grouped).reduce((a, b) => a + b, 0)
        const reasons: FailureReason[] = Object.entries(grouped)
          .map(([reason, count]) => ({
            reason: reason.length > 30 ? reason.substring(0, 30) + "..." : reason,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)

        setData(reasons)
      }
      setLoading(false)
    }

    fetchFailures()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Motivos de Falha</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full rounded-full" />
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Motivos de Falha</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500 py-8 text-center">
            Nenhuma falha registrada
          </p>
        </CardContent>
      </Card>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload as FailureReason
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl">
        <p className="text-sm text-zinc-50">{d.reason}</p>
        <p className="text-xs text-zinc-400">
          {d.count} ocorrências ({d.percentage.toFixed(1)}%)
        </p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Motivos de Falha</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="reason"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={55}
                strokeWidth={0}
              >
                {data.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={COLORS[idx % COLORS.length]}
                    className="hover:opacity-80 transition-opacity"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string) => (
                  <span className="text-xs text-zinc-400">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-1">
          {data.map((item, idx) => (
            <div key={item.reason} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-zinc-400">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                {item.reason}
              </span>
              <span className="text-zinc-50">{item.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
