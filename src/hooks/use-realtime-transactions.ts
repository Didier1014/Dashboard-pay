"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Transaction, TransactionFilters } from "@/types"

interface UseRealtimeTransactionsReturn {
  transactions: Transaction[]
  loading: boolean
  hasMore: boolean
  loadMore: () => void
  refresh: () => void
}

export function useRealtimeTransactions(
  filters: TransactionFilters = {},
  limit = 20,
): UseRealtimeTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const fetchTransactions = useCallback(
    async (currentOffset: number, append = false) => {
      setLoading(true)
      const supabase = createClient()
      if (!supabase) {
        setLoading(false)
        return
      }

      let query = supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .range(currentOffset, currentOffset + limit - 1)

      if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status)
      }
      if (filters.payment_method && filters.payment_method !== "all") {
        query = query.eq("payment_method", filters.payment_method)
      }
      if (filters.date_from) {
        query = query.gte("created_at", filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte("created_at", filters.date_to)
      }
      if (filters.campaign) {
        query = query.eq("utm_campaign", filters.campaign)
      }
      if (filters.search) {
        query = query.or(
          `customer_name.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%,product_name.ilike.%${filters.search}%`,
        )
      }

      const { data, error } = await query

      if (error) {
        console.error("Erro ao buscar transações:", error)
        setLoading(false)
        return
      }

      setTransactions((prev) =>
        append ? [...prev, ...(data as Transaction[])] : (data as Transaction[]),
      )
      setHasMore((data?.length ?? 0) === limit)
      setLoading(false)
    },
    [filters, limit],
  )

  useEffect(() => {
    setOffset(0)
    fetchTransactions(0, false)
  }, [fetchTransactions])

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return

    const channel = supabase
      .channel("transactions-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newTx = payload.new as Transaction
            setTransactions((prev) => [newTx, ...prev])
          } else if (payload.eventType === "UPDATE") {
            const updatedTx = payload.new as Transaction
            setTransactions((prev) =>
              prev.map((tx) => (tx.id === updatedTx.id ? updatedTx : tx)),
            )
          } else if (payload.eventType === "DELETE") {
            setTransactions((prev) =>
              prev.filter((tx) => tx.id !== payload.old.id),
            )
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadMore = useCallback(() => {
    const newOffset = offset + limit
    setOffset(newOffset)
    fetchTransactions(newOffset, true)
  }, [offset, limit, fetchTransactions])

  const refresh = useCallback(() => {
    setOffset(0)
    fetchTransactions(0, false)
  }, [fetchTransactions])

  return { transactions, loading, hasMore, loadMore, refresh }
}
