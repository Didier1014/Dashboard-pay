"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X, Filter } from "lucide-react"
import type { TransactionFilters, TransactionStatus, PaymentMethod } from "@/types"
import { STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/constants"

interface TransactionFiltersProps {
  filters: TransactionFilters
  onChange: (filters: TransactionFilters) => void
}

export function TransactionFilters({ filters, onChange }: TransactionFiltersProps) {
  const updateFilter = <K extends keyof TransactionFilters>(
    key: K,
    value: TransactionFilters[K],
  ) => {
    onChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onChange({})
  }

  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== "" && v !== "all")

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          placeholder="Buscar por nome, email ou produto..."
          value={filters.search || ""}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      <Select
        value={filters.status || "all"}
        onValueChange={(v) => updateFilter("status", v as TransactionStatus | "all")}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.payment_method || "all"}
        onValueChange={(v) => updateFilter("payment_method", v as PaymentMethod | "all")}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Método" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={filters.date_from || ""}
        onChange={(e) => updateFilter("date_from", e.target.value)}
        className="w-[140px] h-10"
      />

      <Input
        type="date"
        value={filters.date_to || ""}
        onChange={(e) => updateFilter("date_to", e.target.value)}
        className="w-[140px] h-10"
      />

      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={clearFilters} className="text-zinc-400 hover:text-zinc-50">
          <X className="h-4 w-4" />
        </Button>
      )}

      <Button variant="outline" size="sm" className="gap-2">
        <Filter className="h-4 w-4" />
        Filtros
      </Button>
    </div>
  )
}
