"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import type { Transaction } from "@/types"
import { formatCurrency, formatDate } from "@/lib/utils"
import { STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/constants"

interface ExportCsvButtonProps {
  transactions: Transaction[]
}

export function ExportCsvButton({ transactions }: ExportCsvButtonProps) {
  const exportToCsv = () => {
    const headers = [
      "ID",
      "Data",
      "Cliente",
      "Email",
      "Produto",
      "Valor",
      "Método",
      "Status",
      "UTM Source",
      "UTM Medium",
      "UTM Campaign",
      "Afiliado",
      "Motivo Falha",
    ]

    const rows = transactions.map((tx) => [
      tx.id,
      formatDate(tx.created_at, "long"),
      tx.customer_name,
      tx.customer_email,
      tx.product_name,
      formatCurrency(tx.amount / 100),
      PAYMENT_METHOD_LABELS[tx.payment_method],
      STATUS_LABELS[tx.status],
      tx.utm_source || "",
      tx.utm_medium || "",
      tx.utm_campaign || "",
      tx.affiliate_code || "",
      tx.failure_reason || "",
    ])

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `transacoes-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={exportToCsv}>
      <Download className="h-4 w-4" />
      Exportar CSV
    </Button>
  )
}
