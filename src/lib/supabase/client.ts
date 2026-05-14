import { createBrowserClient } from "@supabase/ssr"

let _client: any = null

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    if (typeof window !== "undefined") {
      console.warn("Supabase: URL ou chave não configuradas")
    }
    return null
  }

  if (!_client) {
    try {
      _client = createBrowserClient(url, key, {
        auth: { persistSession: false },
      })
    } catch (e) {
      console.error("Supabase: erro ao criar client", e)
      return null
    }
  }
  return _client
}
