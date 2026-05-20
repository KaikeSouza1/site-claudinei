-- ============================================================
-- MÓDULO: PÓS-VENDA / GESTÃO CONTRATUAL
-- Execute no SQL Editor do Supabase
-- ============================================================

-- --------------------------------------------------------
-- TABELA: contratos
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS contratos (
  id                  BIGSERIAL PRIMARY KEY,

  -- Vínculos
  lead_id             BIGINT REFERENCES leads(id) ON DELETE SET NULL,
  imovel_id           BIGINT REFERENCES imoveis(id) ON DELETE SET NULL,

  -- Partes
  cliente_nome        TEXT NOT NULL,
  cliente_email       TEXT,
  cliente_telefone    TEXT,
  cliente_cpf         TEXT,
  proprietario_nome   TEXT,

  -- Negócio
  tipo                TEXT NOT NULL CHECK (tipo IN ('aluguel', 'venda')),
  status              TEXT NOT NULL DEFAULT 'ativo'
                        CHECK (status IN ('ativo', 'encerrado', 'rescindido', 'pendente')),

  -- Valores
  valor_total         NUMERIC(14,2),           -- venda: preço total; aluguel: soma do período
  valor_parcela       NUMERIC(14,2) NOT NULL,  -- aluguel: aluguel mensal; venda: valor da parcela
  valor_entrada       NUMERIC(14,2) DEFAULT 0,
  total_parcelas      INT NOT NULL DEFAULT 1,
  dia_vencimento      INT NOT NULL DEFAULT 5 CHECK (dia_vencimento BETWEEN 1 AND 28),

  -- Vigência
  data_inicio         DATE NOT NULL,
  data_fim            DATE,                    -- NULL = indeterminado (aluguel sem prazo)
  data_assinatura     DATE,

  -- Imóvel snapshot (para histórico mesmo se imóvel mudar)
  imovel_titulo       TEXT,
  imovel_endereco     TEXT,

  -- Integração futura (plugável sem refatorar UI)
  fintech_id          TEXT,                   -- ID externo gerado pela Fintech
  fintech_dados       JSONB DEFAULT '{}',     -- payload livre da Fintech
  nfse_ativo          BOOLEAN DEFAULT FALSE,  -- habilitar emissão de NFS-e
  nfse_dados          JSONB DEFAULT '{}',     -- config municipio, CNPJ prestador, etc.

  anotacoes           TEXT,
  criado_em           TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- TABELA: parcelas
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS parcelas (
  id                  BIGSERIAL PRIMARY KEY,
  contrato_id         BIGINT NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,

  numero              INT NOT NULL,           -- 1, 2, 3 …
  descricao           TEXT,                   -- ex: "Aluguel – Junho/2025"

  valor               NUMERIC(14,2) NOT NULL,
  data_vencimento     DATE NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pendente'
                        CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),

  -- Baixa manual
  data_pagamento      DATE,
  valor_pago          NUMERIC(14,2),
  forma_pagamento     TEXT CHECK (forma_pagamento IN ('pix','boleto','transferencia','dinheiro','cartao', NULL)),
  comprovante_url     TEXT,

  -- Integração futura Fintech (plugável)
  boleto_id           TEXT,                   -- ID do boleto/cobrança na Fintech
  boleto_url          TEXT,                   -- URL do boleto gerado
  boleto_dados        JSONB DEFAULT '{}',     -- resposta completa da Fintech

  -- Integração futura NFSe (plugável)
  nfse_numero         TEXT,
  nfse_url            TEXT,
  nfse_dados          JSONB DEFAULT '{}',

  anotacoes           TEXT,
  criado_em           TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- TRIGGER: atualiza atualizado_em automaticamente
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.atualizado_em = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_contratos_atualizado_em ON contratos;
CREATE TRIGGER trg_contratos_atualizado_em
  BEFORE UPDATE ON contratos
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

DROP TRIGGER IF EXISTS trg_parcelas_atualizado_em ON parcelas;
CREATE TRIGGER trg_parcelas_atualizado_em
  BEFORE UPDATE ON parcelas
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- --------------------------------------------------------
-- ÍNDICES
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_contratos_lead_id    ON contratos(lead_id);
CREATE INDEX IF NOT EXISTS idx_contratos_imovel_id  ON contratos(imovel_id);
CREATE INDEX IF NOT EXISTS idx_contratos_status     ON contratos(status);
CREATE INDEX IF NOT EXISTS idx_parcelas_contrato_id ON parcelas(contrato_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_status      ON parcelas(status);
CREATE INDEX IF NOT EXISTS idx_parcelas_vencimento  ON parcelas(data_vencimento);

-- --------------------------------------------------------
-- SEGURANÇA: desabilita RLS (mesmo padrão do projeto)
-- --------------------------------------------------------
ALTER TABLE contratos DISABLE ROW LEVEL SECURITY;
ALTER TABLE parcelas  DISABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- FUNÇÃO UTILITÁRIA: gera parcelas automaticamente
-- Chamada internamente; pode ser chamada manualmente também.
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION gerar_parcelas(p_contrato_id BIGINT)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  c          contratos%ROWTYPE;
  i          INT;
  venc       DATE;
  mes_inicio INT;
  ano_inicio INT;
BEGIN
  SELECT * INTO c FROM contratos WHERE id = p_contrato_id;

  -- Remove parcelas existentes (permite regerar)
  DELETE FROM parcelas WHERE contrato_id = p_contrato_id;

  mes_inicio := EXTRACT(MONTH FROM c.data_inicio);
  ano_inicio := EXTRACT(YEAR  FROM c.data_inicio);

  FOR i IN 1..c.total_parcelas LOOP
    venc := make_date(
      ano_inicio + ((mes_inicio + i - 2) / 12),
      ((mes_inicio + i - 2) % 12) + 1,
      c.dia_vencimento
    );

    INSERT INTO parcelas (contrato_id, numero, descricao, valor, data_vencimento)
    VALUES (
      p_contrato_id,
      i,
      CASE c.tipo
        WHEN 'aluguel' THEN 'Aluguel – ' || TO_CHAR(venc, 'Month/YYYY')
        ELSE                'Parcela '   || i || '/' || c.total_parcelas
      END,
      c.valor_parcela,
      venc
    );
  END LOOP;
END;
$$;
