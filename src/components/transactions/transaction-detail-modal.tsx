"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatDate } from "@/lib/utils"
import { STATUS_LABELS, STATUS_COLORS, PAYMENT_METHOD_LABELS } from "@/lib/constants"
import type { Transaction } from "@/types"
import { Copy, ExternalLink } from "lucide-react"

interface TransactionDetailModalProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransactionDetailModal({
  transaction,
  open,
  onOpenChange,
}: TransactionDetailModalProps) {
  if (!transaction) return null

  const statusColor = STATUS_COLORS[transaction.status] as "green" | "red" | "yellow" | "blue" | "orange" | "purple" | "gray"

  const details = [
    { label: "ID da Transação", value: transaction.id },
    { label: "ID do Pagamento", value: transaction.payment_id || "-" },
    { label: "Data", value: formatDate(transaction.created_at, "long") },
    { label: "Cliente", value: transaction.customer_name },
    { label: "Email", value: transaction.customer_email },
    { label: "Telefone", value: transaction.customer_phone || "-" },
    { label: "Produto", value: transaction.product_name },
    { label: "Valor Bruto", value: formatCurrency(transaction.amount / 100) },
    { label: "Taxa", value: formatCurrency((transaction.fee_amount ?? 0) / 100) },
    { label: "Valor Líquido", value: formatCurrency((transaction.net_amount ?? transaction.amount) / 100) },
    { label: "Parcelas", value: String(transaction.installment_count ?? 1) },
    { label: "Método", value: PAYMENT_METHOD_LABELS[transaction.payment_method] },
    { label: "Motivo da Falha", value: transaction.failure_reason || "-" },
    { label: "UTM Source", value: transaction.utm_source || "-" },
    { label: "UTM Campaign", value: transaction.utm_campaign || "-" },
    { label: "UTM Medium", value: transaction.utm_medium || "-" },
    { label: "Afiliado", value: transaction.affiliate_code || "-" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Detalhes da Transação
            <Badge variant={statusColor} dot>
              {STATUS_LABELS[transaction.status]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Informações completas da transação
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {details.map(({ label, value }) => (
            <div key={label} className="space-y-1">
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="text-sm text-zinc-50 font-medium flex items-center gap-2">
                {value}
                {(label === "ID da Transação" || label === "ID do Pagamento") && value !== "-" && (
                  <button
                    onClick={() => navigator.clipboard.writeText(value)}
                    className="text-zinc-500 hover:text-zinc-50 transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                )}
              </p>
            </div>
          ))}
        </div>

        <Separator className="bg-zinc-800" />

        <div className="rounded-lg bg-zinc-800/50 p-4">
          <p className="text-xs text-zinc-500 mb-1">Metadados</p>
          <pre className="text-xs text-zinc-300 font-mono overflow-auto max-h-32">
            {JSON.stringify(transaction.metadata, null, 2) || "{}"}
          </pre>
        </div>

        {transaction.payment_method === "stripe" && transaction.payment_id && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() =>
              window.open(
                `https://dashboard.stripe.com/payments/${transaction.payment_id}`,
                "_blank",
              )
            }
          >
            <ExternalLink className="h-4 w-4" />
            Ver no Dashboard Stripe
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
