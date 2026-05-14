import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status")
    const payment_method = searchParams.get("payment_method")
    const search = searchParams.get("search")
    const date_from = searchParams.get("date_from")
    const date_to = searchParams.get("date_to")
    const campaign = searchParams.get("campaign")

    const supabase = await createServerSupabaseClient()
    const offset = (page - 1) * limit

    let query = supabase
      .from("transactions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== "all") query = query.eq("status", status)
    if (payment_method && payment_method !== "all") query = query.eq("payment_method", payment_method)
    if (date_from) query = query.gte("created_at", date_from)
    if (date_to) query = query.lte("created_at", date_to)
    if (campaign) query = query.eq("utm_campaign", campaign)
    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,product_name.ilike.%${search}%`,
      )
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      transactions: data,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
