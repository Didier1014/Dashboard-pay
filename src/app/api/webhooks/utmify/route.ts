import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const supabase = createAdminClient()
    const clickId = body.click_id || body.utmify_click_id
    const sale = body.sale || body

    if (!clickId) {
      return NextResponse.json({ error: "Missing click_id" }, { status: 400 })
    }

    const utmData = {
      utm_source: sale.utm_source || body.utm_source || "",
      utm_medium: sale.utm_medium || body.utm_medium || "",
      utm_campaign: sale.utm_campaign || body.utm_campaign || "",
      utm_term: sale.utm_term || body.utm_term || "",
      utm_content: sale.utm_content || body.utm_content || "",
      utmify_click_id: clickId,
      affiliate_code: sale.affiliate_code || body.affiliate_code || "",
    }

    if (sale.transaction_id || body.transaction_id) {
      const txId = sale.transaction_id || body.transaction_id

      if (body.event === "conversion" || sale.status === "completed") {
        await supabase
          .from("transactions")
          .update({
            ...utmData,
            updated_at: new Date().toISOString(),
          })
          .eq("payment_id", txId)

        await supabase.from("click_funnel").insert({
          stage: "comprou",
          product_name: sale.product_name || body.product_name,
          ...utmData,
          metadata: { transaction_id: txId },
        })
      }
    }

    await supabase.from("click_funnel").insert({
      stage: body.event === "click" ? "visitou" : "iniciou_checkout",
      product_name: sale.product_name || body.product_name,
      ...utmData,
      metadata: body,
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Utmify webhook error:", error)
    return NextResponse.json({ error: "Webhook error" }, { status: 400 })
  }
}
