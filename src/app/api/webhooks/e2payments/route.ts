import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const supabase = createAdminClient()
    const event = body.event || body.type
    const charge = body.data || body.charge || body

    if (!charge || !charge.id) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    switch (event) {
      case "charge.completed":
      case "payment.approved": {
        await supabase.from("transactions").upsert(
          {
            payment_id: charge.id,
            status: "completed",
            customer_name: charge.customer?.name || charge.customer_name || "Cliente",
            customer_email: charge.customer?.email || charge.customer_email || "",
            product_name: charge.description || charge.product_name || "Produto",
            amount: charge.amount || charge.value || 0,
            currency: charge.currency || "BRL",
            payment_method: "e2payments",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "payment_id" },
        )
        break
      }

      case "charge.failed":
      case "payment.refused": {
        await supabase
          .from("transactions")
          .update({
            status: "failed",
            failure_reason: charge.failure_reason || charge.reason || "Erro no pagamento",
            updated_at: new Date().toISOString(),
          })
          .eq("payment_id", charge.id)
        break
      }

      case "charge.refunded": {
        await supabase
          .from("transactions")
          .update({ status: "refunded", updated_at: new Date().toISOString() })
          .eq("payment_id", charge.id)
        break
      }

      case "charge.pending": {
        await supabase
          .from("transactions")
          .update({ status: "processing", updated_at: new Date().toISOString() })
          .eq("payment_id", charge.id)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("E2Payments webhook error:", error)
    return NextResponse.json({ error: "Webhook error" }, { status: 400 })
  }
}
