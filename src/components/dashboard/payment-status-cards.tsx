"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle2, XCircle, TrendingUp } from "lucide-react"

interface PaymentStats {
  succeeded: number
  failed: number
  total: number
  succeededAmount: number
  failedAmount: number
  approvalRate: number
}

export function PaymentStatusCards() {
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: succeeded } = await supabase
        .from("transactions")
        .select("amount")
        .eq("status", "completed")
        .gte("created_at", today.toISOString())

      const { data: failed } = await supabase
        .from("transactions")
        .select("amount")
        .eq("status", "failed")
        .gte("created_at", today.toISOString())

      const succeededCount = succeeded?.length || 0
      const failedCount = failed?.length || 0
      const succeededAmount = succeeded?.reduce((acc, t) => acc + (t.amount || 0), 0) || 0
      const failedAmount = failed?.reduce((acc, t) => acc + (t.amount || 0), 0) || 0
      const total = succeededCount + failedCount

      setStats({
        succeeded: succeededCount,
        failed: failedCount,
        total,
        succeededAmount,
        failedAmount,
        approvalRate: total > 0 ? succeededCount / total : 0,
      })
      setLoading(false)
    }

    fetchStats()

    const supabase = createClient()
    const channel = supabase
      .channel("payment-stats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        fetchStats,
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
            <CardContent><Skeleton className="h-8 w-32" /></CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Sucedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-emerald-400">{stats.succeeded}</p>
          <p className="text-xs text-zinc-500 mt-1">
            {formatCurrency(stats.succeededAmount / 100)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400" />
            Falhados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
          <p className="text-xs text-zinc-500 mt-1">
            {formatCurrency(stats.failedAmount / 100)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            Taxa de Aprovação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-400">
            {formatPercent(stats.approvalRate)}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {stats.total} transações no total
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
