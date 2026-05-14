import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("app_config")
      .select("*")
      .order("category")
      .order("key")

    if (error) throw error

    const masked = (data || []).map((item: any) => ({
      ...item,
      value: item.encrypted ? "••••••••" : item.value,
    }))

    return NextResponse.json({ configs: masked })
  } catch (error) {
    console.error("Error fetching config:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json({ error: "key e value são obrigatórios" }, { status: 400 })
    }

    const supabase = createClient()
    const { error } = await supabase.from("app_config").upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating config:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
