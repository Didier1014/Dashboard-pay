-- ============================================
-- Schema do banco - PayFlow Dashboard
-- ============================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum: status da transação
CREATE TYPE transaction_status AS ENUM (
  'pending', 'processing', 'completed', 'failed', 'refunded', 'chargeback', 'cancelled'
);

-- Enum: método de pagamento
CREATE TYPE payment_method AS ENUM ('stripe', 'e2payments');

-- Enum: estágio do funil
CREATE TYPE conversion_stage AS ENUM (
  'visitou', 'iniciou_checkout', 'checkout_abandonado', 'comprou'
);

-- ============================================
-- Tabela principal: transactions
-- ============================================
CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Cliente
  customer_name   TEXT NOT NULL,
  customer_email  TEXT NOT NULL,
  customer_phone  TEXT,

  -- Produto
  product_name    TEXT NOT NULL,
  product_id      TEXT,

  -- Valores (em centavos)
  amount          BIGINT NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'BRL',
  fee_amount      BIGINT DEFAULT 0,
  net_amount      BIGINT DEFAULT 0,
  installment_count INTEGER DEFAULT 1,

  -- Pagamento
  payment_method  payment_method NOT NULL,
  status          transaction_status NOT NULL DEFAULT 'pending',
  payment_id      TEXT,
  failure_reason  TEXT,

  -- UTM / Marketing
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  utm_term        TEXT,
  utm_content     TEXT,
  utmify_click_id TEXT,
  affiliate_code  TEXT,

  -- Funil
  conversion_stage conversion_stage DEFAULT 'visitou',

  -- Metadados flexíveis
  metadata        JSONB DEFAULT '{}'::jsonb
);

-- Índices para performance
CREATE INDEX idx_transactions_created_at ON transactions (created_at DESC);
CREATE INDEX idx_transactions_status ON transactions (status);
CREATE INDEX idx_transactions_payment_method ON transactions (payment_method);
CREATE INDEX idx_transactions_utm_campaign ON transactions (utm_campaign);
CREATE INDEX idx_transactions_customer_email ON transactions (customer_email);
CREATE INDEX idx_transactions_product_name ON transactions (product_name);

-- Índice composto para consultas de dashboard
CREATE INDEX idx_transactions_date_status ON transactions (created_at DESC, status);
CREATE INDEX idx_transactions_campaign_date ON transactions (utm_campaign, created_at DESC);

-- ============================================
-- Tabela: click_funnel (rastreio de funil)
-- ============================================
CREATE TABLE click_funnel (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  stage           conversion_stage NOT NULL,
  product_name    TEXT,
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  utm_term        TEXT,
  utm_content     TEXT,
  utmify_click_id TEXT,

  metadata        JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_click_funnel_session ON click_funnel (session_id);
CREATE INDEX idx_click_funnel_created_at ON click_funnel (created_at DESC);
CREATE INDEX idx_click_funnel_stage ON click_funnel (stage);

-- ============================================
-- Tabela: conversion_metrics (cache de métricas)
-- ============================================
CREATE TABLE conversion_metrics (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  campaign        TEXT,

  visits          INTEGER DEFAULT 0,
  initiated_checkouts INTEGER DEFAULT 0,
  abandoned_checkouts  INTEGER DEFAULT 0,
  purchases       INTEGER DEFAULT 0,
  revenue         BIGINT DEFAULT 0,

  UNIQUE (date, campaign)
);

CREATE INDEX idx_conversion_metrics_date ON conversion_metrics (date DESC);

-- ============================================
-- Trigger: atualiza updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Realtime: habilitar para transações
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE click_funnel;

-- ============================================
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_funnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_metrics ENABLE ROW LEVEL SECURITY;

-- Política: apenas usuários autenticados podem ler
CREATE POLICY "Usuários autenticados podem ler transações"
  ON transactions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir transações"
  ON transactions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar transações"
  ON transactions FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Mesmas políticas para click_funnel
CREATE POLICY "Usuários autenticados podem ler funil"
  ON click_funnel FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir funil"
  ON click_funnel FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Políticas para conversion_metrics
CREATE POLICY "Usuários autenticados podem ler métricas"
  ON conversion_metrics FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir métricas"
  ON conversion_metrics FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- Tabela: app_config (configurações editáveis)
-- ============================================
CREATE TABLE app_config (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  label       TEXT,
  category    TEXT DEFAULT 'general',
  encrypted   BOOLEAN DEFAULT false,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES auth.users(id)
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ler config"
  ON app_config FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir config"
  ON app_config FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar config"
  ON app_config FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Seed: configurações padrão
INSERT INTO app_config (key, value, label, category) VALUES
  ('stripe_publishable_key', '', 'Stripe Publishable Key', 'stripe'),
  ('stripe_secret_key', '', 'Stripe Secret Key', 'stripe'),
  ('stripe_webhook_secret', '', 'Stripe Webhook Secret', 'stripe'),
  ('e2payments_api_url', 'https://api.e2payments.com/v1', 'E2Payments API URL', 'e2payments'),
  ('e2payments_secret_key', '', 'E2Payments Secret Key', 'e2payments'),
  ('utmify_api_key', '', 'Utmify API Key', 'utmify'),
  ('utmify_webhook_secret', '', 'Utmify Webhook Secret', 'utmify'),
  ('supabase_url', '', 'Supabase Project URL', 'supabase'),
  ('supabase_anon_key', '', 'Supabase Anon Key', 'supabase'),
  ('supabase_service_key', '', 'Supabase Service Role Key', 'supabase'),
  ('site_url', 'http://localhost:3000', 'Site URL', 'general')
ON CONFLICT (key) DO NOTHING;
