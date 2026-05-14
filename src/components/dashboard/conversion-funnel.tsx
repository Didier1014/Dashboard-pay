"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CONVERSION_STAGE_LABELS } from "@/lib/constants"
import type { ConversionFunnel as ConversionFunnelType } from "@/types"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function ConversionFunnel() {
  const [funnel, setFunnel] = useState<ConversionFunnelType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFunnel = async () => {
      const supabase = createClient()
      const stages = ["visitou", "iniciou_checkout", "checkout_abandonado", "comprou"] as const
      const result: ConversionFunnelType[] = []

      for (const stage of stages) {
        const { count } = await supabase
          .from("click_funnel")
          .select("*", { count: "exact", head: true })
          .eq("stage", stage)

        result.push({
          stage,
          count: count || 0,
          percentage: 0,
        })
      }

      const maxCount = result[0]?.count || 1
      setFunnel(
        result.map((r) => ({
          ...r,
          percentage: maxCount > 0 ? (r.count / maxCount) * 100 : 0,
        })),
      )
      setLoading(false)
    }

    fetchFunnel()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const colors = ["bg-zinc-600", "bg-blue-500", "bg-yellow-500", "bg-emerald-500"]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Funil de Conversão</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {funnel.map((stage, idx) => (
            <div key={stage.stage} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-300">
                  {CONVERSION_STAGE_LABELS[stage.stage]}
                </span>
                <span className="text-zinc-50 font-semibold">{stage.count}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${colors[idx]}`}
                  style={{ width: `${stage.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
