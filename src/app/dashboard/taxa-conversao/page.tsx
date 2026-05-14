"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import { formatPercent } from "@/lib/utils"
import { ConversionFunnel } from "@/components/dashboard/conversion-funnel"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

interface CampaignComparison {
  campaign: string
  visits: number
  purchases: number
  rate: number
}

export default function TaxaConversaoPage() {
  const [overallRate, setOverallRate] = useState(0)
  const [checkoutRate, setCheckoutRate] = useState(0)
  const [loading, setLoading] = useState(true)
  const [campaignData, setCampaignData] = useState<CampaignComparison[]>([])
  const [evolutionData, setEvolutionData] = useState<{ date: string; rate: number }[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      if (!supabase) { setLoading(false); return }

      const { count: visits } = await supabase
        .from("click_funnel")
        .select("*", { count: "exact", head: true })
        .eq("stage", "visitou")

      const { count: initiated } = await supabase
        .from("click_funnel")
        .select("*", { count: "exact", head: true })
        .eq("stage", "iniciou_checkout")

      const { count: purchases } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed")

      if (visits && visits > 0) {
        setOverallRate(purchases! / visits)
      }
      if (initiated && initiated > 0) {
        setCheckoutRate(purchases! / initiated)
      }

      const { data: campaigns } = await supabase
        .from("conversion_metrics")
        .select("*")
        .order("date", { ascending: false })
        .limit(30)

      if (campaigns) {
        type CampaignRow = { date: string | null; campaign: string | null; visits: number; purchases: number }
        const rows = campaigns as CampaignRow[]
        const campaignMap = new Map<string, { visits: number; purchases: number }>()
        rows.forEach((c) => {
          const key = c.campaign || "Sem campanha"
          const curr = campaignMap.get(key) || { visits: 0, purchases: 0 }
          curr.visits += c.visits || 0
          curr.purchases += c.purchases || 0
          campaignMap.set(key, curr)
        })

        setCampaignData(
          Array.from(campaignMap.entries()).map(([campaign, data]) => ({
            campaign,
            visits: data.visits,
            purchases: data.purchases,
            rate: data.visits > 0 ? data.purchases / data.visits : 0,
          })),
        )

        const evo = rows
          .filter((c) => c.date)
          .reduce<Record<string, { visits: number; purchases: number }>>((acc, c) => {
            const key = c.date!
            if (!acc[key]) acc[key] = { visits: 0, purchases: 0 }
            acc[key].visits += c.visits || 0
            acc[key].purchases += c.purchases || 0
            return acc
          }, {})

        setEvolutionData(
          Object.entries(evo)
            .map(([date, d]) => ({
              date: new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
              rate: d.visits > 0 ? (d.purchases / d.visits) * 100 : 0,
            }))
            .slice(-14),
        )
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl">
        <p className="text-xs text-zinc-400 mb-1">{label}</p>
        <p className="text-sm font-semibold text-emerald-400">
          {typeof payload[0].value === "number" ? payload[0].value.toFixed(1) : payload[0].value}%
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Taxa de Conversão</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Acompanhe a evolução da sua taxa de conversão
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa Geral</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <p className="text-2xl font-bold text-emerald-400">
                  {formatPercent(overallRate)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Visitante → Compra</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Checkout → Compra</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <p className="text-2xl font-bold text-purple-400">
                  {formatPercent(checkoutRate)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Iniciou Checkout → Comprou</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Abandono de Checkout</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <p className="text-2xl font-bold text-yellow-400">
                  {formatPercent(1 - checkoutRate)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Abandonaram antes de comprar</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Evolução da Taxa</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#a1a1aa", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#a1a1aa", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v.toFixed(0)}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="rate"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Comparação por Campanha</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <div className="space-y-3">
                {campaignData.map((c) => (
                  <div key={c.campaign} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">{c.campaign}</span>
                      <span className="text-zinc-50 font-semibold">
                        {formatPercent(c.rate)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-500 transition-all duration-700"
                        style={{ width: `${Math.min(c.rate * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500">
                      {c.purchases} compras de {c.visits} visitas
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConversionFunnel />
    </div>
  )
}
