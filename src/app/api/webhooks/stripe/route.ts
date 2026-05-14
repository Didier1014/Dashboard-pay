import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe/client"
import { createAdminClient } from "@/lib/supabase/admin"
import { getConfig } from "@/lib/config"

export async function POST(req: Request) {
  try {
    const stripe = await getStripe()
    const body = await req.text()
    const signature = req.headers.get("stripe-signature")

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    const webhookSecret = await getConfig("stripe_webhook_secret") || process.env.STRIPE_WEBHOOK_SECRET || ""
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    const supabase = createAdminClient()

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any
        await supabase.from("transactions").upsert(
          {
            payment_id: session.id,
            status: "completed",
            customer_name: session.metadata?.customer_name || session.customer_details?.name || "Cliente",
            customer_email: session.customer_details?.email || "",
            product_name: session.metadata?.product_name || "Produto",
            amount: session.amount_total || 0,
            currency: session.currency || "brl",
            payment_method: "stripe",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "payment_id" },
        )
        break
      }

      case "checkout.session.expired": {
        const expiredSession = event.data.object as any
        await supabase
          .from("transactions")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("payment_id", expiredSession.id)
        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as any
        const failureReason =
          paymentIntent.last_payment_error?.message || "Erro desconhecido"
        await supabase
          .from("transactions")
          .update({
            status: "failed",
            failure_reason: failureReason,
            updated_at: new Date().toISOString(),
          })
          .eq("payment_id", paymentIntent.id)
        break
      }

      case "charge.refunded": {
        const charge = event.data.object as any
        await supabase
          .from("transactions")
          .update({ status: "refunded", updated_at: new Date().toISOString() })
          .eq("payment_id", charge.payment_intent)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Stripe webhook error:", error)
    return NextResponse.json({ error: "Webhook error" }, { status: 400 })
  }
}
