"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatDate } from "@/lib/utils"
import { STATUS_LABELS } from "@/lib/constants"
import type { Transaction } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecent = async () => {
      const supabase = createClient()
      if (!supabase) { setLoading(false); return }
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5)

      if (data) setTransactions(data as Transaction[])
      setLoading(false)
    }

    fetchRecent()

    const supabase = createClient()
    if (!supabase) return
    const channel = supabase
      .channel("recent-tx")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions" },
        (payload) => {
          setTransactions((prev) => [payload.new as Transaction, ...prev].slice(0, 5))
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const getStatusColor = (status: string) => {
    const map: Record<string, "green" | "red" | "yellow" | "blue" | "orange" | "purple" | "gray"> = {
      completed: "green", failed: "red", pending: "yellow",
      processing: "blue", refunded: "orange", chargeback: "red", cancelled: "gray",
    }
    return map[status] || "gray"
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Últimas Transações</CardTitle>
        <Link
          href="/dashboard/transacoes"
          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
        >
          Ver todas <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-zinc-500 py-4 text-center">
            Nenhuma transação recente
          </p>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx, idx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-zinc-800/50 animate-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-50 truncate">
                      {tx.customer_name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {tx.product_name} • {formatDate(tx.created_at, "relative")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-mono font-semibold text-zinc-50">
                    {formatCurrency(tx.amount / 100)}
                  </span>
                  <Badge variant={getStatusColor(tx.status)} dot>
                    {STATUS_LABELS[tx.status]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
