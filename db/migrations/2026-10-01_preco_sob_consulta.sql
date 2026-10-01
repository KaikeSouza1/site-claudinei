-- Opção "Valor a consultar": o anúncio aparece sem preço no site.
-- A coluna preco continua existindo (pode ficar 0 ou com o valor de referência interno).
ALTER TABLE imoveis ADD COLUMN IF NOT EXISTS preco_sob_consulta boolean NOT NULL DEFAULT false;
