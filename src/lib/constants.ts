export const APP_NAME = "PayFlow"
export const APP_DESCRIPTION = "Dashboard de vendas ao vivo para infoprodutos"

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  processing: "Processando",
  completed: "Aprovado",
  failed: "Falhou",
  refunded: "Reembolsado",
  chargeback: "Chargeback",
  cancelled: "Cancelado",
}

export const STATUS_COLORS: Record<string, string> = {
  pending: "yellow",
  processing: "blue",
  completed: "green",
  failed: "red",
  refunded: "orange",
  chargeback: "red",
  cancelled: "gray",
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  stripe: "Stripe",
  e2payments: "E2Payments",
}

export const CONVERSION_STAGE_LABELS: Record<string, string> = {
  visitou: "Visitou",
  iniciou_checkout: "Iniciou Checkout",
  checkout_abandonado: "Abandonou",
  comprou: "Comprou",
}

export const CURRENCY_SYMBOL = "R$"

export const ITEMS_PER_PAGE = 20
