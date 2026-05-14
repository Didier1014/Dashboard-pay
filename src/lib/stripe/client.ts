import Stripe from "stripe"
import { getStripeSecretKey } from "@/lib/config"

let _stripe: Stripe | null = null

export async function getStripe(): Promise<Stripe> {
  if (!_stripe) {
    const secretKey = await getStripeSecretKey()
    if (!secretKey) throw new Error("Stripe secret key não configurada")
    _stripe = new Stripe(secretKey, {
      apiVersion: "2026-04-22.dahlia",
      typescript: true,
    })
  }
  return _stripe
}

export function resetStripeClient() {
  _stripe = null
}
