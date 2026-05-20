-- ============================================================
-- CRM MIGRATION - Execute no Supabase SQL Editor
-- ============================================================

-- Tabela de Leads (clientes interessados)
CREATE TABLE IF NOT EXISTS leads (
  id            BIGSERIAL PRIMARY KEY,
  nome          VARCHAR(255) NOT NULL,
  email         VARCHAR(255),
  telefone      VARCHAR(20),
  mensagem      TEXT,
  origem        VARCHAR(50)  DEFAULT 'site',     -- site | whatsapp | indicacao | telefone | portal | instagram
  status        VARCHAR(50)  DEFAULT 'novo',     -- novo | contato_feito | visita_agendada | proposta | fechado | perdido
  prioridade    VARCHAR(20)  DEFAULT 'media',    -- baixa | media | alta | urgente
  imovel_interesse_id     BIGINT REFERENCES imoveis(id) ON DELETE SET NULL,
  imovel_interesse_titulo TEXT,
  anotacoes     TEXT,
  criado_em     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Atividades (histórico de interações)
CREATE TABLE IF NOT EXISTS atividades (
  id              BIGSERIAL PRIMARY KEY,
  lead_id         BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tipo            VARCHAR(50) NOT NULL,   -- ligacao | whatsapp | email | visita | proposta | nota
  descricao       TEXT NOT NULL,
  data_atividade  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  criado_em       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_atualizado_em ON leads;
CREATE TRIGGER leads_atualizado_em
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_atualizado_em();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_status       ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_prioridade   ON leads(prioridade);
CREATE INDEX IF NOT EXISTS idx_leads_criado_em    ON leads(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_atividades_lead_id ON atividades(lead_id);

-- Desabilitar RLS (usamos service_role key nas APIs admin)
ALTER TABLE leads      DISABLE ROW LEVEL SECURITY;
ALTER TABLE atividades DISABLE ROW LEVEL SECURITY;
