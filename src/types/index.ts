export type PaymentMethod = "stripe" | "e2payments"

export type TransactionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded"
  | "chargeback"
  | "cancelled"

export type ConversionStage =
  | "visitou"
  | "iniciou_checkout"
  | "checkout_abandonado"
  | "comprou"

export interface Transaction {
  id: string
  created_at: string
  updated_at: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  product_name: string
  product_id?: string
  amount: number
  currency: string
  payment_method: PaymentMethod
  status: TransactionStatus
  payment_id?: string
  installment_count?: number
  fee_amount?: number
  net_amount?: number
  failure_reason?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  utmify_click_id?: string
  affiliate_code?: string
  conversion_stage?: ConversionStage
  metadata?: Record<string, unknown>
}

export interface TransactionFilters {
  search?: string
  status?: TransactionStatus | "all"
  payment_method?: PaymentMethod | "all"
  date_from?: string
  date_to?: string
  campaign?: string
  min_amount?: number
  max_amount?: number
}

export interface KpiData {
  revenue_today: number
  revenue_yesterday: number
  sales_count_today: number
  sales_count_yesterday: number
  average_ticket: number
  average_ticket_yesterday: number
  roas: number
  conversion_rate: number
  approval_rate: number
  failed_count_today: number
}

export interface SalesPoint {
  timestamp: string
  value: number
  cumulative: number
}

export interface ConversionFunnel {
  stage: ConversionStage
  count: number
  percentage: number
}

export interface PaymentMethodStats {
  method: PaymentMethod
  total: number
  succeeded: number
  failed: number
  revenue: number
}

export interface FailureReason {
  reason: string
  count: number
  percentage: number
}

export interface MetricComparison {
  current: number
  previous: number
  variation: number
}
