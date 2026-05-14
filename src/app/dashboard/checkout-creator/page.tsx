"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { ShoppingCart, CreditCard, Zap, Copy, ExternalLink } from "lucide-react"

export default function CheckoutCreatorPage() {
  const [loading, setLoading] = useState(false)
  const [checkoutUrl, setCheckoutUrl] = useState("")
  const [form, setForm] = useState({
    product_name: "",
    amount: "",
    payment_method: "stripe",
    customer_email: "",
    customer_name: "",
    success_url: "",
    cancel_url: "",
  })

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleCreate = async () => {
    if (!form.product_name || !form.amount) {
      toast.error("Preencha o nome do produto e o valor")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: Math.round(parseFloat(form.amount) * 100),
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setCheckoutUrl(data.url)
      toast.success("Checkout criado com sucesso!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar checkout")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Criar Checkout</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Crie links de pagamento rápido para Stripe ou E2Payments
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Novo Checkout
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Nome do Produto *</label>
              <Input
                placeholder="Ex: Curso Completo de Marketing"
                value={form.product_name}
                onChange={(e) => updateForm("product_name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Valor (R$) *</label>
              <Input
                type="number"
                step="0.01"
                min="1"
                placeholder="97,00"
                value={form.amount}
                onChange={(e) => updateForm("amount", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Método de Pagamento</label>
              <Select
                value={form.payment_method}
                onValueChange={(v) => updateForm("payment_method", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stripe">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" /> Stripe
                    </div>
                  </SelectItem>
                  <SelectItem value="e2payments">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" /> E2Payments
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-zinc-800" />

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Nome do Cliente</label>
              <Input
                placeholder="João Silva"
                value={form.customer_name}
                onChange={(e) => updateForm("customer_name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Email do Cliente</label>
              <Input
                type="email"
                placeholder="joao@email.com"
                value={form.customer_email}
                onChange={(e) => updateForm("customer_email", e.target.value)}
              />
            </div>

            <Separator className="bg-zinc-800" />

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">URL de Sucesso</label>
              <Input
                placeholder="https://seusite.com/obrigado"
                value={form.success_url}
                onChange={(e) => updateForm("success_url", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">URL de Cancelamento</label>
              <Input
                placeholder="https://seusite.com/carrinho"
                value={form.cancel_url}
                onChange={(e) => updateForm("cancel_url", e.target.value)}
              />
            </div>

            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? (
                "Criando Checkout..."
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Criar Checkout
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {checkoutUrl && (
            <Card className="border-emerald-500/30">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-400">
                  <Badge variant="green" dot>Checkout Criado</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-zinc-800/50 p-3">
                  <p className="text-xs text-zinc-500 mb-1">URL do Checkout</p>
                  <p className="text-sm text-emerald-400 break-all font-mono">{checkoutUrl}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => {
                      navigator.clipboard.writeText(checkoutUrl)
                      toast.success("URL copiada!")
                    }}
                  >
                    <Copy className="h-4 w-4" /> Copiar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => window.open(checkoutUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" /> Abrir
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Checkouts Rápidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { name: "Produto R$47", amount: 4700 },
                { name: "Produto R$97", amount: 9700 },
                { name: "Produto R$197", amount: 19700 },
                { name: "Produto R$497", amount: 49700 },
                { name: "Produto R$997", amount: 99700 },
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      product_name: item.name,
                      amount: (item.amount / 100).toFixed(2),
                    }))
                  }}
                  className="w-full flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm hover:bg-zinc-800 transition-colors"
                >
                  <span className="text-zinc-300">{item.name}</span>
                  <span className="font-mono text-zinc-50">
                    R$ {(item.amount / 100).toFixed(2)}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
