"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function useRealtimeStatus() {
  const [isConnected, setIsConnected] = useState(false)
  const [salesToday, setSalesToday] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return

    const channel = supabase
      .channel("realtime-status")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions" },
        () => {
          setSalesToday((prev) => prev + 1)
        },
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED")
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { isConnected, salesToday }
}
