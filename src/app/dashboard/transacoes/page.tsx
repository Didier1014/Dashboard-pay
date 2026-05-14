"use client"

import { useState } from "react"
import { TransactionTable } from "@/components/transactions/transaction-table"
import { TransactionFilters } from "@/components/transactions/transaction-filters"
import { ExportCsvButton } from "@/components/transactions/export-csv-button"
import { useRealtimeTransactions } from "@/hooks/use-realtime-transactions"
import type { TransactionFilters as Filters } from "@/types"

export default function TransacoesPage() {
  const [filters, setFilters] = useState<Filters>({})
  const { transactions, loading, hasMore, loadMore } = useRealtimeTransactions(filters)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Histórico de Transações</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {transactions.length} transações encontradas
          </p>
        </div>
        <ExportCsvButton transactions={transactions} />
      </div>

      <TransactionFilters filters={filters} onChange={setFilters} />

      <TransactionTable
        transactions={transactions}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMore}
      />
    </div>
  )
}
