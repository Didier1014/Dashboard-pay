"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PaymentStatusCards } from "@/components/dashboard/payment-status-cards"
import { FailurePieChart } from "@/components/dashboard/failure-pie-chart"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/utils"
import { STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import type { Transaction, PaymentMethodStats } from "@/types"

export default function PagamentosPage() {
  const [failedTransactions, setFailedTransactions] = useState<Transaction[]>([])
  const [methodStats, setMethodStats] = useState<PaymentMethodStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const { data: failed } = await supabase
        .from("transactions")
        .select("*")
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(50)

      if (failed) setFailedTransactions(failed as Transaction[])

      const stripeData = await supabase
        .from("transactions")
        .select("amount, status")
        .eq("payment_method", "stripe")

      const e2Data = await supabase
        .from("transactions")
        .select("amount, status")
        .eq("payment_method", "e2payments")

      const buildStats = (
        data: { amount: number; status: string }[] | null,
        method: "stripe" | "e2payments",
      ): PaymentMethodStats => {
        const all = data || []
        return {
          method,
          total: all.length,
          succeeded: all.filter((t) => t.status === "completed").length,
          failed: all.filter((t) => t.status === "failed").length,
          revenue: all
            .filter((t) => t.status === "completed")
            .reduce((acc, t) => acc + (t.amount || 0), 0),
        }
      }

      setMethodStats([
        buildStats(stripeData.data, "stripe"),
        buildStats(e2Data.data, "e2payments"),
      ])
      setLoading(false)
    }

    fetchData()
  }, [])

  const getStatusBadge = (status: string) => {
    const map: Record<string, "green" | "red" | "yellow" | "blue" | "orange" | "purple" | "gray"> = {
      failed: "red", completed: "green", pending: "yellow",
      processing: "blue", refunded: "orange", chargeback: "red", cancelled: "gray",
    }
    return map[status] || "gray"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Pagamentos</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Acompanhe pagamentos sucedidos e falhados
        </p>
      </div>

      <PaymentStatusCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {methodStats.map((stat) => (
          <Card key={stat.method}>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Badge variant="purple">{PAYMENT_METHOD_LABELS[stat.method]}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-zinc-500">Total</p>
                    <p className="text-lg font-bold text-zinc-50">{stat.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Sucedidos</p>
                    <p className="text-lg font-bold text-emerald-400">{stat.succeeded}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Receita</p>
                    <p className="text-lg font-bold text-zinc-50">
                      {formatCurrency(stat.revenue / 100)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <FailurePieChart />
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Pagamentos Falhados ({failedTransactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : failedTransactions.length === 0 ? (
                <p className="text-sm text-zinc-500 py-8 text-center">
                  Nenhum pagamento falhado encontrado
                </p>
              ) : (
                <div className="rounded-lg border border-zinc-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="max-w-[250px]">Motivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {failedTransactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-xs text-zinc-400">
                            {formatDate(tx.created_at, "short")}
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-zinc-50">{tx.customer_name}</p>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-zinc-50">
                            {formatCurrency(tx.amount / 100)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="purple">
                              {PAYMENT_METHOD_LABELS[tx.payment_method]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadge(tx.status)} dot>
                              {STATUS_LABELS[tx.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-zinc-400 max-w-[250px] truncate" title={tx.failure_reason}>
                            {tx.failure_reason || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
