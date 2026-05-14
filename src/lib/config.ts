import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/client"

export type ConfigCategory = "stripe" | "e2payments" | "utmify" | "supabase" | "general"

export interface ConfigItem {
  key: string
  value: string
  label: string
  category: ConfigCategory
  encrypted: boolean
  updated_at: string
}

export async function getConfig(key: string): Promise<string | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", key)
      .single()
    return data?.value ?? null
  } catch {
    return process.env[key.toUpperCase()] || null
  }
}

export async function getAllConfig(): Promise<ConfigItem[]> {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from("app_config")
      .select("*")
      .order("category")
      .order("key")
    return (data as ConfigItem[]) || []
  } catch {
    return []
  }
}

export async function updateConfig(key: string, value: string): Promise<void> {
  const supabase = createClient()
  await supabase.from("app_config").upsert(
    {
      key,
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  )

  if (key === "stripe_secret_key" || key === "stripe_publishable_key") {
    clearStripeCache()
  }
}

let _cachedStripeKey: string | null = null
let _cachedStripePubKey: string | null = null

export async function getStripeSecretKey(): Promise<string> {
  if (_cachedStripeKey) return _cachedStripeKey
  _cachedStripeKey = (await getConfig("stripe_secret_key")) || process.env.STRIPE_SECRET_KEY || ""
  return _cachedStripeKey
}

export async function getStripePublishableKey(): Promise<string> {
  if (_cachedStripePubKey) return _cachedStripePubKey
  _cachedStripePubKey = (await getConfig("stripe_publishable_key")) || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
  return _cachedStripePubKey
}

export function clearStripeCache() {
  _cachedStripeKey = null
  _cachedStripePubKey = null
}

export async function getE2PaymentsKey(): Promise<string> {
  return (await getConfig("e2payments_secret_key")) || process.env.E2PAYMENTS_SECRET_KEY || ""
}

export async function getE2PaymentsUrl(): Promise<string> {
  return (await getConfig("e2payments_api_url")) || process.env.E2PAYMENTS_API_URL || "https://api.e2payments.com/v1"
}

export async function getUtmifyKey(): Promise<string> {
  return (await getConfig("utmify_api_key")) || process.env.UTMIFY_API_KEY || ""
}

export const CONFIG_CATEGORIES: { key: ConfigCategory; label: string; icon: string }[] = [
  { key: "stripe", label: "Stripe", icon: "CreditCard" },
  { key: "e2payments", label: "E2Payments", icon: "Zap" },
  { key: "utmify", label: "Utmify", icon: "Target" },
  { key: "supabase", label: "Supabase", icon: "Database" },
  { key: "general", label: "Geral", icon: "Settings" },
]
