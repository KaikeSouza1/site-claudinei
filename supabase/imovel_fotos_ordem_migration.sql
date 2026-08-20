-- ============================================================
-- ORDEM DAS FOTOS DO IMÓVEL - Execute no Supabase SQL Editor
-- ============================================================
-- Corrige o bug de "não consigo deixar as fotos na ordem que eu quero":
-- a tabela imovel_fotos não tinha coluna de ordem, então a galeria era
-- sempre exibida numa ordem arbitrária do banco, ignorando o que o
-- corretor organizava no painel admin.

ALTER TABLE imovel_fotos ADD COLUMN IF NOT EXISTS ordem INTEGER NOT NULL DEFAULT 0;

-- Preenche a ordem das fotos já cadastradas, usando a ordem de inserção
-- atual (id) como ponto de partida, por imóvel.
UPDATE imovel_fotos AS f
SET ordem = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY imovel_id ORDER BY id) - 1 AS rn
  FROM imovel_fotos
) AS sub
WHERE f.id = sub.id;

CREATE INDEX IF NOT EXISTS idx_imovel_fotos_imovel_ordem ON imovel_fotos (imovel_id, ordem);
