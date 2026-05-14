"use client"

import { useState } from "react"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatDate } from "@/lib/utils"
import { STATUS_LABELS, STATUS_COLORS, PAYMENT_METHOD_LABELS } from "@/lib/constants"
import { TransactionDetailModal } from "./transaction-detail-modal"
import type { Transaction } from "@/types"
import { Eye, ArrowUpDown } from "lucide-react"

interface TransactionTableProps {
  transactions: Transaction[]
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
}

export function TransactionTable({
  transactions,
  loading,
  hasMore,
  onLoadMore,
}: TransactionTableProps) {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const openDetail = (tx: Transaction) => {
    setSelectedTx(tx)
    setModalOpen(true)
  }

  const getStatusColor = (status: string) => {
    const map: Record<string, "green" | "red" | "yellow" | "blue" | "orange" | "purple" | "gray"> = {
      completed: "green",
      failed: "red",
      pending: "yellow",
      processing: "blue",
      refunded: "orange",
      chargeback: "red",
      cancelled: "gray",
    }
    return map[status] || "gray"
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
        <p className="text-lg font-medium">Nenhuma transação encontrada</p>
        <p className="text-sm">Tente ajustar os filtros ou aguarde novas vendas.</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">
                <button className="flex items-center gap-1 hover:text-zinc-50 transition-colors">
                  Data <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Campanha</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id} className="group animate-fade-in">
                <TableCell className="text-zinc-400 text-xs">
                  {formatDate(tx.created_at, "short")}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium text-zinc-50">{tx.customer_name}</p>
                    <p className="text-xs text-zinc-500">{tx.customer_email}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-zinc-300">{tx.product_name}</TableCell>
                <TableCell className="text-right font-mono text-sm font-semibold text-zinc-50">
                  {formatCurrency(tx.amount / 100)}
                </TableCell>
                <TableCell>
                  <Badge variant="purple">
                    {PAYMENT_METHOD_LABELS[tx.payment_method]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(tx.status)} dot>
                    {STATUS_LABELS[tx.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-zinc-400">
                  {tx.utm_campaign || "-"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => openDetail(tx)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onLoadMore} disabled={loading}>
            {loading ? "Carregando..." : "Carregar mais"}
          </Button>
        </div>
      )}

      <TransactionDetailModal
        transaction={selectedTx}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  )
}
