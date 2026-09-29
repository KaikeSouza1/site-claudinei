-- ============================================================
-- CADASTRO COMPLETO DE IMÓVEL
-- Novos dados públicos, código automático, dados internos e documentos.
-- Idempotente: pode ser executado mais de uma vez.
-- ============================================================

BEGIN;

-- ── 1. Novos campos públicos em imoveis ─────────────────────
ALTER TABLE imoveis
  ADD COLUMN IF NOT EXISTS cep                    varchar(9),
  ADD COLUMN IF NOT EXISTS numero                 varchar(20),
  ADD COLUMN IF NOT EXISTS complemento            varchar(100),
  ADD COLUMN IF NOT EXISTS estado                 varchar(2),
  ADD COLUMN IF NOT EXISTS area_construida        numeric(12,2),
  ADD COLUMN IF NOT EXISTS area_terreno           numeric(12,2),
  ADD COLUMN IF NOT EXISTS suites                 integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pavimentos             integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS caracteristicas        text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS aceita_financiamento   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS aceita_fgts            boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS aceita_permuta         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS aceita_negociacao      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS documentacao_regular   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ocupacao               varchar(20),   -- 'desocupado' | 'ocupado'
  ADD COLUMN IF NOT EXISTS disponibilidade_visitas text,
  ADD COLUMN IF NOT EXISTS video_url              text;

-- A área antiga (única) vira área construída nos imóveis já cadastrados.
UPDATE imoveis SET area_construida = area
WHERE area_construida IS NULL AND area IS NOT NULL;

-- ── 2. Código automático por tipo (CASA01, SOBR01...) ───────
CREATE TABLE IF NOT EXISTS imovel_codigo_seq (
  prefixo varchar(10) PRIMARY KEY,
  ultimo  integer NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION prefixo_codigo_imovel(p_tipo text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE lower(coalesce(p_tipo, ''))
    WHEN 'casa'        THEN 'CASA'
    WHEN 'sobrado'     THEN 'SOBR'
    WHEN 'apartamento' THEN 'APTO'
    WHEN 'kitnet'      THEN 'KIT'
    WHEN 'terreno'     THEN 'TERR'
    WHEN 'comercial'   THEN 'COML'
    WHEN 'chácara'     THEN 'CHAC'
    WHEN 'sítio'       THEN 'SIT'
    WHEN 'fazenda'     THEN 'FAZ'
    ELSE coalesce(nullif(upper(left(translate(p_tipo,
           'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ ',
           'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'), 4)), ''), 'IMV')
  END
$$;

-- Incrementa o contador do prefixo de forma atômica (sem repetir código
-- mesmo com dois cadastros ao mesmo tempo).
CREATE OR REPLACE FUNCTION gerar_codigo_imovel(p_tipo text)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  v_prefixo text := prefixo_codigo_imovel(p_tipo);
  v_numero  integer;
BEGIN
  LOOP
    INSERT INTO imovel_codigo_seq (prefixo, ultimo) VALUES (v_prefixo, 1)
    ON CONFLICT (prefixo) DO UPDATE SET ultimo = imovel_codigo_seq.ultimo + 1
    RETURNING ultimo INTO v_numero;

    -- Pula números já usados manualmente
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM imoveis WHERE upper(codigo) = v_prefixo || lpad(v_numero::text, 2, '0')
    );
  END LOOP;
  RETURN v_prefixo || lpad(v_numero::text, 2, '0');
END;
$$;

CREATE OR REPLACE FUNCTION trg_imovel_codigo()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.codigo IS NULL OR btrim(NEW.codigo) = '' THEN
    NEW.codigo := gerar_codigo_imovel(NEW.tipo);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS imovel_codigo_auto ON imoveis;
CREATE TRIGGER imovel_codigo_auto
  BEFORE INSERT ON imoveis
  FOR EACH ROW EXECUTE FUNCTION trg_imovel_codigo();

-- Inicia os contadores a partir dos códigos que já existem (ex.: SOBR01 → 1)
INSERT INTO imovel_codigo_seq (prefixo, ultimo)
SELECT substring(upper(codigo) FROM '^([A-Z]+)\d+$'),
       max(substring(codigo FROM '(\d+)$')::integer)
FROM imoveis
WHERE upper(codigo) ~ '^[A-Z]+\d+$'
GROUP BY 1
ON CONFLICT (prefixo) DO UPDATE SET ultimo = GREATEST(imovel_codigo_seq.ultimo, EXCLUDED.ultimo);

-- Imóveis antigos sem código recebem um agora
UPDATE imoveis SET codigo = gerar_codigo_imovel(tipo)
WHERE codigo IS NULL OR btrim(codigo) = '';

-- ── 3. Dados internos (nunca expostos no site público) ──────
CREATE TABLE IF NOT EXISTS imovel_interno (
  imovel_id              integer PRIMARY KEY REFERENCES imoveis(id) ON DELETE CASCADE,
  matricula              text,
  inscricao_imobiliaria  text,
  proprietario_nome      text,
  proprietario_telefone  text,
  proprietario_email     text,
  proprietario_cpf       text,
  area_registrada        numeric(12,2),
  area_averbada          numeric(12,2),
  iptu_valor             numeric(12,2),
  iptu_situacao          text,
  possui_financiamento   boolean NOT NULL DEFAULT false,
  onus                   text,
  financiamento_bancario boolean NOT NULL DEFAULT false,
  comissao_percentual    numeric(5,2),
  comissao_valor         numeric(14,2),
  autorizacao_venda      boolean NOT NULL DEFAULT false,
  autorizacao_validade   date,
  observacoes            text,
  atualizado_em          timestamptz NOT NULL DEFAULT now()
);

-- ── 4. Documentos (PDFs) guardados no próprio banco ─────────
CREATE TABLE IF NOT EXISTS imovel_documentos (
  id         serial PRIMARY KEY,
  imovel_id  integer NOT NULL REFERENCES imoveis(id) ON DELETE CASCADE,
  nome       text    NOT NULL,
  categoria  varchar(30) NOT NULL DEFAULT 'outro',
  mime       varchar(100) NOT NULL,
  tamanho    integer NOT NULL,
  conteudo   bytea   NOT NULL,
  criado_em  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_imovel_documentos_imovel ON imovel_documentos (imovel_id);

COMMIT;
