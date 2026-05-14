import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe/client"
import { createAdminClient } from "@/lib/supabase/admin"
import { getE2PaymentsKey, getE2PaymentsUrl, getConfig } from "@/lib/config"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      product_name,
      amount,
      payment_method,
      customer_email,
      customer_name,
      success_url,
      cancel_url,
    } = body

    if (!product_name || !amount) {
      return NextResponse.json(
        { error: "product_name e amount são obrigatórios" },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()
    const siteUrl = await getConfig("site_url") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

    if (payment_method === "stripe") {
      const stripe = await getStripe()
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: { name: product_name },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: success_url || `${siteUrl}/dashboard/transacoes`,
        cancel_url: cancel_url || `${siteUrl}/dashboard/checkout-creator`,
        customer_email: customer_email || undefined,
        metadata: {
          product_name,
          customer_name: customer_name || "",
        },
      })

      await supabase.from("transactions").insert({
        customer_name: customer_name || "Cliente",
        customer_email: customer_email || "",
        product_name,
        amount,
        payment_method: "stripe",
        status: "pending",
        payment_id: session.id,
        metadata: { checkout_session_id: session.id },
      })

      return NextResponse.json({ url: session.url, id: session.id })
    }

    if (payment_method === "e2payments") {
      const e2Key = await getE2PaymentsKey()
      const e2Url = await getE2PaymentsUrl()

      const e2Payload = {
        amount,
        currency: "BRL",
        description: product_name,
        customer: {
          name: customer_name || "Cliente",
          email: customer_email || "",
        },
        notification_url: `${siteUrl}/api/webhooks/e2payments`,
        ...(success_url ? { redirect_url: success_url } : {}),
      }

      const e2Res = await fetch(`${e2Url}/v1/charges`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${e2Key}`,
        },
        body: JSON.stringify(e2Payload),
      })

      const e2Data = await e2Res.json()

      if (!e2Res.ok) {
        throw new Error(e2Data.error || "Erro E2Payments")
      }

      await supabase.from("transactions").insert({
        customer_name: customer_name || "Cliente",
        customer_email: customer_email || "",
        product_name,
        amount,
        payment_method: "e2payments",
        status: "pending",
        payment_id: e2Data.id,
      })

      return NextResponse.json({
        url: e2Data.checkout_url || e2Data.url,
        id: e2Data.id,
      })
    }

    return NextResponse.json({ error: "Método inválido" }, { status: 400 })
  } catch (error) {
    console.error("Erro ao criar checkout:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 },
    )
  }
}
