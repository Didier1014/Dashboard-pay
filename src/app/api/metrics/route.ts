import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today.getTime() + 86400000)

    const todayStr = today.toISOString()
    const tomorrowStr = tomorrow.toISOString()

    const { data: todaySales } = await supabase
      .from("transactions")
      .select("amount, status, payment_method, created_at")
      .gte("created_at", todayStr)
      .lt("created_at", tomorrowStr)

    const { data: funnel } = await supabase
      .from("click_funnel")
      .select("stage")
      .gte("created_at", todayStr)

    const completed = todaySales?.filter((t) => t.status === "completed") || []
    const failed = todaySales?.filter((t) => t.status === "failed") || []
    const visits = funnel?.filter((f) => f.stage === "visitou").length || 0
    const purchases = funnel?.filter((f) => f.stage === "comprou").length || 0

    return NextResponse.json({
      revenue_today: completed.reduce((acc, t) => acc + (t.amount || 0), 0),
      sales_count_today: completed.length,
      failed_count_today: failed.length,
      total_today: todaySales?.length || 0,
      conversion_rate: visits > 0 ? purchases / visits : 0,
      approval_rate:
        (todaySales?.length || 0) > 0
          ? completed.length / (todaySales?.length || 0)
          : 0,
      average_ticket:
        completed.length > 0
          ? completed.reduce((acc, t) => acc + (t.amount || 0), 0) / completed.length
          : 0,
      visits_today: visits,
      purchases_today: purchases,
    })
  } catch (error) {
    console.error("Error fetching metrics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
