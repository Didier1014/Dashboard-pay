"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { CreditCard, Zap, Target, Database, Settings, Save, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import type { ConfigItem, ConfigCategory } from "@/lib/config"

const CATEGORY_META: Record<ConfigCategory, { label: string; icon: any; color: string }> = {
  stripe: { label: "Stripe", icon: CreditCard, color: "purple" },
  e2payments: { label: "E2Payments", icon: Zap, color: "blue" },
  utmify: { label: "Utmify", icon: Target, color: "orange" },
  supabase: { label: "Supabase", icon: Database, color: "green" },
  general: { label: "Geral", icon: Settings, color: "gray" },
}

export default function ConfiguracoesPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([])
  const [edited, setEdited] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
      try {
        const res = await fetch("/api/config")
        if (!res.ok) throw new Error()
      const data = await res.json()
      setConfigs(data.configs || [])
    } catch {
      toast.error("Erro ao carregar configurações")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (key: string) => {
    setSaving((prev) => ({ ...prev, [key]: true }))
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: edited[key] || "" }),
      })

      if (!res.ok) throw new Error()

      toast.success("Configuração salva!")
      setEdited((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      setConfigs((prev) =>
        prev.map((c) => (c.key === key ? { ...c, value: edited[key] || "" } : c)),
      )
    } catch {
      toast.error("Erro ao salvar")
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }))
    }
  }

  const grouped = configs.reduce<Record<string, ConfigItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  const isSecret = (key: string) =>
    key.includes("secret") || key.includes("key") || key.includes("token")

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-zinc-50">Configurações</h1></div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 2 }).map((_, j) => (
                <Skeleton key={j} className="h-16 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Configurações</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Gerencie suas credenciais e integrações
        </p>
      </div>

      {Object.entries(grouped).map(([category, items]) => {
        const meta = CATEGORY_META[category as ConfigCategory] || CATEGORY_META.general
        const Icon = meta.icon
        const allSaved = items.every((item) => !edited[item.key])

        return (
          <Card key={category}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-zinc-400" />
                <CardTitle className="text-sm font-medium">{meta.label}</CardTitle>
                {allSaved && items.some((i) => i.value) && (
                  <Badge variant="green" dot>Configurado</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => {
                const secret = isSecret(item.key)
                const isVisible = visible[item.key]
                const isEdited = item.key in edited
                const currentValue = edited[item.key] ?? item.value
                const isSaving = saving[item.key]

                return (
                  <div key={item.key} className="space-y-1.5">
                    <label className="text-sm text-zinc-400 flex items-center gap-2">
                      {item.label}
                      <span className="text-xs text-zinc-600">({item.key})</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={secret && !isVisible ? "password" : "text"}
                          value={currentValue}
                          onChange={(e) =>
                            setEdited((prev) => ({ ...prev, [item.key]: e.target.value }))
                          }
                          placeholder={secret ? "••••••••" : "Digite o valor..."}
                          className="pr-10"
                        />
                        {secret && (
                          <button
                            type="button"
                            onClick={() =>
                              setVisible((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-50"
                          >
                            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSave(item.key)}
                        disabled={!isEdited || isSaving}
                        className="gap-1.5 shrink-0"
                      >
                        {isSaving ? (
                          "Salvando..."
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Salvar
                          </>
                        )}
                      </Button>
                    </div>
                    {isEdited && (
                      <p className="text-xs text-yellow-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Alteração não salva
                      </p>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Instruções</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-400 space-y-2">
          <p>1. Configure as chaves de cada integração nos campos acima.</p>
          <p>2. As credenciais são salvas no banco de dados e usadas em tempo real.</p>
          <p>3. Para testar, crie um checkout na página "Criar Checkout".</p>
          <p>4. Configure os webhooks no Stripe/E2Payments/Utmify apontando para:</p>
          <code className="block rounded-lg bg-zinc-800 p-2 mt-1 text-xs text-emerald-400 font-mono">
            {typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/stripe
          </code>
        </CardContent>
      </Card>
    </div>
  )
}
