# Sistema de Boletos Bancários — Asaas
## Guia Completo de Integração, Configuração e Operação

---

## Índice

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Arquitetura Técnica — O que Foi Construído](#2-arquitetura-técnica--o-que-foi-construído)
3. [Pré-Requisitos](#3-pré-requisitos)
4. [Passo a Passo — Criar Conta no Asaas (Sandbox)](#4-passo-a-passo--criar-conta-no-asaas-sandbox)
5. [Configurar o Webhook no Asaas](#5-configurar-o-webhook-no-asaas)
6. [Configuração Local — Variáveis de Ambiente](#6-configuração-local--variáveis-de-ambiente)
7. [Como Usar no Painel Administrativo](#7-como-usar-no-painel-administrativo)
8. [Fluxo Completo de Pagamento (do início ao fim)](#8-fluxo-completo-de-pagamento-do-início-ao-fim)
9. [Passando para Produção](#9-passando-para-produção)
10. [Configuração no Vercel](#10-configuração-no-vercel)
11. [Banco de Dados — Campos Utilizados](#11-banco-de-dados--campos-utilizados)
12. [Segurança do Painel Administrativo](#12-segurança-do-painel-administrativo)
13. [Troubleshooting — Problemas Comuns](#13-troubleshooting--problemas-comuns)
14. [Checklist Final antes de ir ao Ar](#14-checklist-final-antes-de-ir-ao-ar)

---

## 1. Visão Geral do Sistema

O sistema de boletos bancários foi construído em cima do **Asaas**, uma fintech brasileira que oferece emissão de boletos, cobranças PIX e outros serviços financeiros via API.

### O que o sistema faz automaticamente:

| Funcionalidade | Descrição |
|---|---|
| **Emissão de boleto individual** | Gera um boleto para uma parcela específica com um clique |
| **Emissão em massa** | Gera boletos para todas as parcelas pendentes de um contrato de uma só vez |
| **Sincronização de cliente** | Cria ou reutiliza o cliente no Asaas baseado no CPF |
| **Baixa automática** | Quando o boleto é pago, a parcela é marcada como paga automaticamente via webhook |
| **Idempotência** | Nunca gera boleto duplicado para a mesma parcela |
| **Multa e juros** | Aplica 2% de multa + 1% de juros ao mês automaticamente após o vencimento |

### O que o corretor/admin vê na tela:

- Linha digitável (código de barras) para copiar e enviar ao cliente
- Botão para abrir o PDF do boleto
- Link para a fatura online do Asaas
- Badge de status do boleto em tempo real
- Informação de quando foi gerado e quando foi pago

---

## 2. Arquitetura Técnica — O que Foi Construído

### Arquivos criados ou modificados:

```
site-corretor/
├── lib/
│   └── asaas.ts                              ← Service layer — toda lógica da API Asaas
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── parcelas/[id]/
│   │   │   │   └── boleto/route.ts           ← Gerar boleto de uma parcela
│   │   │   └── contratos/[id]/
│   │   │       └── boletos/route.ts          ← Gerar boletos de todas as parcelas
│   │   └── webhooks/
│   │       └── asaas/route.ts                ← Recebe notificações de pagamento do Asaas
│   └── admin/
│       └── contratos/[id]/page.tsx           ← Interface com botões e modal de boleto
├── middleware.ts                             ← Protege /admin e /api/admin, libera /api/webhooks
└── .env                                      ← Variáveis de ambiente (nunca versionar)
```

### Descrição de cada arquivo:

#### `lib/asaas.ts` — Camada de serviço
Contém três funções principais:

- **`getOrCreateCustomer(nome, cpf, email, telefone)`**
  - Busca se já existe um cliente no Asaas com aquele CPF via `GET /customers?cpfCnpj=...`
  - Se não existir, cria via `POST /customers`
  - Retorna o `customerId` do Asaas
  - Isso evita clientes duplicados no painel do Asaas

- **`criarBoleto(parcelaId, valor, dueDate, descricao, customerId)`**
  - Chama `POST /payments` com `billingType: 'BOLETO'`
  - Define multa de 2% e juros de 1%/mês
  - Usa `externalReference: "parcela_{id}"` como referência de rastreamento
  - Retorna: `paymentId`, `barCode` (linha digitável), `bankSlipUrl` (PDF), `invoiceUrl`, `nossoNumero`, `status`

#### `app/api/admin/parcelas/[id]/boleto/route.ts` — Boleto individual
- Endpoint: `POST /api/admin/parcelas/{id}/boleto`
- Busca a parcela e seu contrato no Supabase
- Verifica se o CPF do cliente está preenchido (obrigatório)
- Garante que o cliente existe no Asaas (cria se necessário)
- Salva o `asaas_customer_id` no contrato para não precisar buscar novamente
- Gera o boleto e salva os dados na parcela
- Se já existe boleto Asaas para a parcela, retorna o existente (idempotente)

#### `app/api/admin/contratos/[id]/boletos/route.ts` — Geração em massa
- Endpoint: `POST /api/admin/contratos/{id}/boletos`
- Filtra apenas parcelas que: não estão pagas, não estão canceladas, e não têm boleto Asaas
- Cria o cliente no Asaas uma única vez e gera boleto para cada parcela
- Retorna um relatório: quantos foram gerados, quantos falharam e os erros

#### `app/api/webhooks/asaas/route.ts` — Baixa automática
- Endpoint público: `POST /api/webhooks/asaas`
- Valida o token de segurança no header `asaas-access-token`
- Processa os eventos `PAYMENT_RECEIVED` e `PAYMENT_CONFIRMED`
- Localiza a parcela pelo `boleto_id` (payment.id do Asaas) ou pelo `externalReference`
- Verifica se já está paga (idempotência — evita dupla baixa)
- Atualiza o status para `pago`, registra a data, o valor e a forma de pagamento

---

## 3. Pré-Requisitos

Antes de começar, você precisa ter:

- [ ] Acesso ao painel administrativo do site (`/admin`)
- [ ] URL pública do site funcionando (para o webhook — pode ser no Vercel)
- [ ] CPF do cliente preenchido nos contratos (campo obrigatório para emitir boleto)
- [ ] Conta no Asaas (sandbox para testar, produção para uso real)

> **Importante:** O Asaas exige CPF ou CNPJ para criar um cliente e emitir boleto. Se um contrato não tiver CPF preenchido, o sistema vai recusar a geração e mostrar uma mensagem de erro.

---

## 4. Passo a Passo — Criar Conta no Asaas (Sandbox)

O Asaas possui um ambiente de **sandbox** completamente separado da produção. Tudo que você fizer no sandbox (clientes, boletos, pagamentos) não tem efeito no mundo real.

### 4.1 Criar conta no sandbox

1. Acesse: **https://sandbox.asaas.com**
2. Clique em **"Criar conta"**
3. Preencha os dados:
   - Nome completo
   - CPF ou CNPJ (pode usar dados fictícios no sandbox)
   - E-mail válido
   - Senha
4. Confirme o e-mail se solicitado
5. Faça login no painel

### 4.2 Obter a API Key

1. Dentro do painel Asaas (sandbox), no menu lateral clique em **"Minha Conta"**
2. Vá em **"Integrações"** (pode estar como "Configurações" → "Integrações")
3. Localize a seção **"Chave de API"** ou **"API Key"**
4. Clique em **"Gerar Chave"** ou copie a chave existente
5. A chave de sandbox começa com `$aact_hmlg_` — guarde essa chave com segurança

> **Atenção:** Nunca compartilhe sua API Key. Ela dá acesso total à sua conta Asaas.

### 4.3 Verificar a conta (apenas produção)

No sandbox isso não é necessário. Mas na conta de produção, o Asaas vai pedir documentos para verificar a empresa antes de liberar emissão de boletos. Veja a seção 9 para mais detalhes.

---

## 5. Configurar o Webhook no Asaas

O webhook é o mecanismo pelo qual o Asaas avisa o sistema quando um boleto foi pago. **Sem o webhook, a baixa automática não funciona** — as parcelas precisariam ser baixadas manualmente.

### 5.1 O que é um Webhook

Quando um cliente paga o boleto, o Asaas envia uma requisição HTTP POST para uma URL do seu sistema informando que o pagamento foi realizado. O sistema recebe essa notificação e marca a parcela como paga automaticamente.

### 5.2 Configurar no painel Asaas

1. No painel Asaas, acesse **"Integrações"** → **"Webhook"** (ou "Notificações de Webhook")
2. Clique em **"Adicionar Webhook"** ou **"Configurar"**
3. Preencha os campos:

   | Campo | Valor |
   |---|---|
   | **URL** | `https://SEU-SITE.vercel.app/api/webhooks/asaas` |
   | **Eventos** | Marque: `PAYMENT_RECEIVED` e `PAYMENT_CONFIRMED` |
   | **Token de Autenticação** (authToken) | Crie uma senha forte, ex: `asaas_wh_2024_SuaSenhaAqui123!` |
   | **Versão** | v3 (a mais recente) |

4. Clique em **"Salvar"**

> **Importante:** A URL precisa ser acessível publicamente na internet. Durante o desenvolvimento local, você pode usar o [ngrok](https://ngrok.com) para expor seu servidor local: `ngrok http 3000` — use a URL que o ngrok gerar.

### 5.3 Guardar o token do webhook

O token que você criou no campo "authToken" precisa ser salvo na variável `ASAAS_WEBHOOK_TOKEN` no seu `.env` e no Vercel. Esse token é verificado toda vez que o Asaas enviar uma notificação — se não bater, a notificação é ignorada (mas o Asaas não é informado para não pausar a fila).

---

## 6. Configuração Local — Variáveis de Ambiente

### 6.1 Editar o arquivo `.env`

Abra o arquivo `.env` na raiz do projeto e preencha as variáveis do Asaas:

```env
# ── Asaas ──────────────────────────────────────────────────────────────────────
ASAAS_API_KEY=$aact_hmlg_SuaChaveDeApiAquiGeradaNoPainel
ASAAS_WEBHOOK_TOKEN=asaas_wh_2024_SuaSenhaAqui123!
ASAAS_ENV=sandbox
```

### 6.2 Descrição de cada variável

| Variável | O que é | Onde encontrar |
|---|---|---|
| `ASAAS_API_KEY` | Chave de acesso à API do Asaas | Painel Asaas → Minha Conta → Integrações |
| `ASAAS_WEBHOOK_TOKEN` | Token para validar notificações recebidas | Você que define ao criar o webhook |
| `ASAAS_ENV` | Ambiente: `sandbox` ou `production` | Defina manualmente |

### 6.3 Reiniciar o servidor

Após editar o `.env`, reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

---

## 7. Como Usar no Painel Administrativo

### 7.1 Pré-condição: CPF do cliente

Antes de gerar qualquer boleto, o contrato precisa ter o CPF do cliente preenchido.

1. Acesse o contrato em `/admin/contratos/{id}`
2. Clique em **"Editar"**
3. Preencha o campo **"CPF"** no formato `000.000.000-00` ou apenas os números
4. Clique em **"Salvar alterações"**

### 7.2 Gerar boleto de uma parcela específica

1. Acesse o contrato desejado em `/admin/contratos/{id}`
2. Na seção **"Parcelas"**, passe o mouse sobre a parcela que deseja gerar o boleto
3. Aparecerão botões de ação — clique no botão **"Boleto"** (ícone de recibo)
4. Um modal abrirá e o boleto será gerado automaticamente no Asaas
5. O modal mostra:
   - **Status** do boleto (Aguardando, Pago, Vencido, etc.)
   - **Linha Digitável** — clique em "Copiar" para copiar o código de barras
   - **Ver PDF** — abre o PDF do boleto em nova aba
   - **Fatura** — abre a fatura online do Asaas

6. Copie a linha digitável ou o link do PDF e envie para o cliente por WhatsApp ou e-mail

### 7.3 Gerar boletos para todas as parcelas de uma vez

1. Acesse o contrato desejado
2. Na seção "Parcelas", se houver parcelas sem boleto, aparece o botão **"Gerar X Boleto(s)"** no canto superior direito
3. Clique no botão
4. O sistema irá gerar boletos para todas as parcelas pendentes/atrasadas que ainda não têm boleto
5. Uma mensagem de feedback aparecerá informando quantos boletos foram gerados

> **Dica:** Use a geração em massa quando assinar um novo contrato — gera todos os boletos de uma vez e envie ao cliente o PDF de cada um.

### 7.4 Verificar status de um boleto já gerado

Ao passar o mouse sobre uma parcela que já tem boleto, o botão **"Boleto"** ainda aparece. Ao clicar, o modal abre mostrando o status atual do boleto no Asaas.

Badges inline na linha da parcela também indicam o status:
- `Boleto gerado` (dourado) — aguardando pagamento
- `Pago` (verde) — pago
- `Vencido` (vermelho) — passou da data

---

## 8. Fluxo Completo de Pagamento (do início ao fim)

```
1. Admin gera o boleto no sistema
        ↓
2. Sistema chama POST /api/admin/parcelas/{id}/boleto
        ↓
3. API busca/cria cliente no Asaas (por CPF)
        ↓
4. API cria boleto no Asaas (POST /payments)
        ↓
5. Asaas retorna: paymentId, barCode, bankSlipUrl, invoiceUrl
        ↓
6. Sistema salva dados na parcela (boleto_id, boleto_dados)
        ↓
7. Modal mostra linha digitável + link do PDF
        ↓
8. Admin envia o boleto/linha digitável para o cliente
        ↓
9. Cliente paga o boleto (banco, app, etc.)
        ↓
10. Asaas detecta o pagamento
        ↓
11. Asaas envia POST para /api/webhooks/asaas com evento PAYMENT_RECEIVED
        ↓
12. Sistema valida o token do webhook
        ↓
13. Sistema localiza a parcela pelo boleto_id
        ↓
14. Sistema verifica se já está paga (evita dupla baixa)
        ↓
15. Sistema atualiza parcela: status=pago, data_pagamento, valor_pago, forma_pagamento
        ↓
16. Parcela aparece como PAGA no painel automaticamente
```

### Tempo estimado entre pagamento e baixa automática

Na maioria dos casos, o Asaas notifica em **menos de 1 minuto** após a compensação. Para boletos pagos em banco físico, pode demorar até **2 dias úteis** para compensar (tempo bancário normal — fora do controle do Asaas).

---

## 9. Passando para Produção

Quando quiser usar o sistema com boletos reais (dinheiro de verdade), siga estes passos:

### 9.1 Criar conta de produção no Asaas

1. Acesse: **https://app.asaas.com**
2. Clique em **"Criar conta"**
3. Preencha os dados reais da empresa/pessoa física (CPF ou CNPJ real)
4. Confirme o e-mail

### 9.2 Verificar a conta (KYC)

O Asaas exige verificação de identidade para liberar a emissão de boletos:

1. Acesse **"Minha Conta"** → **"Dados da Empresa"** ou **"Verificação"**
2. Envie os documentos solicitados:
   - Para **Pessoa Física**: RG/CNH + comprovante de residência
   - Para **Pessoa Jurídica**: Contrato Social + documentos do sócio administrador + comprovante de endereço da empresa
3. Aguarde a aprovação (geralmente 1 a 3 dias úteis)

### 9.3 Configurar conta bancária

1. Em **"Minha Conta"** → **"Dados Bancários"**
2. Cadastre a conta bancária para receber os saques
3. O Asaas mantém os pagamentos recebidos e você faz saques quando desejar

### 9.4 Obter API Key de produção

1. No painel de produção: **"Minha Conta"** → **"Integrações"**
2. Gere a API Key de produção
3. A chave de produção começa com `$aact_` (sem o `_hmlg_`)

### 9.5 Configurar webhook de produção

Repita o processo da seção 5, mas agora no painel de produção (**app.asaas.com**):

- URL: `https://SEU-SITE.vercel.app/api/webhooks/asaas`
- Crie um novo token de webhook (pode ser o mesmo ou diferente do sandbox)

### 9.6 Atualizar as variáveis de ambiente

Troque no arquivo `.env` local e no Vercel:

```env
ASAAS_API_KEY=$aact_SuaChaveDeProducaoAqui
ASAAS_WEBHOOK_TOKEN=seu_token_do_webhook_producao
ASAAS_ENV=production
```

---

## 10. Configuração no Vercel

Todas as variáveis de ambiente precisam ser configuradas no Vercel para funcionar em produção. O arquivo `.env` local **não** é enviado ao Vercel.

### 10.1 Acessar configurações do projeto

1. Acesse **https://vercel.com**
2. Selecione o projeto `site-corretor`
3. Vá em **"Settings"** → **"Environment Variables"**

### 10.2 Variáveis que precisam ser adicionadas

Adicione **todas** as variáveis abaixo em **Production**, **Preview** e **Development** conforme necessário:

#### Autenticação Admin
| Variável | Valor | Descrição |
|---|---|---|
| `ADMIN_USERNAME` | `claudiney` | Login do administrador |
| `ADMIN_PASSWORD_HASH` | `56aba7904d624f4f...` | Hash PBKDF2-SHA512 da senha (copie do .env) |
| `ADMIN_PASSWORD_SALT` | `e2e96fbe438aa87f...` | Salt da senha (copie do .env) |
| `ADMIN_SESSION_SECRET` | `ac03707edd54cbca...` | Segredo para assinar sessões (copie do .env) |

#### Supabase
| Variável | Valor | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Chave anônima do Supabase |

#### Asaas
| Variável | Valor | Descrição |
|---|---|---|
| `ASAAS_API_KEY` | `$aact_hmlg_...` (sandbox) ou `$aact_...` (prod) | API Key do Asaas |
| `ASAAS_WEBHOOK_TOKEN` | Sua senha do webhook | Token configurado no painel Asaas |
| `ASAAS_ENV` | `sandbox` ou `production` | Ambiente |

#### Cloudflare R2 (upload de imagens)
| Variável | Valor |
|---|---|
| `R2_ACCESS_KEY_ID` | ID da chave R2 |
| `R2_SECRET_ACCESS_KEY` | Chave secreta R2 |
| `R2_ACCOUNT_ID` | ID da conta Cloudflare |
| `R2_BUCKET_NAME` | Nome do bucket |
| `NEXT_PUBLIC_R2_URL` | URL pública do bucket |

#### Geral
| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_BASE_URL` | `https://SEU-SITE.vercel.app` |

### 10.3 Após adicionar as variáveis

Faça um novo deploy para as variáveis entrarem em vigor:

```bash
git push origin main
```

Ou clique em **"Redeploy"** no painel Vercel.

---

## 11. Banco de Dados — Campos Utilizados

### Tabela `parcelas`

| Campo | Tipo | O que armazena |
|---|---|---|
| `boleto_id` | `text` | ID do pagamento no Asaas (ex: `pay_abc123`) |
| `boleto_url` | `text` | URL do PDF do boleto |
| `boleto_dados` | `jsonb` | Todos os dados do boleto (veja abaixo) |
| `status` | `text` | `pendente`, `pago`, `atrasado`, `cancelado` |
| `data_pagamento` | `date` | Data em que foi pago (preenchido na baixa) |
| `valor_pago` | `numeric` | Valor efetivamente pago |
| `forma_pagamento` | `text` | `boleto` ou `pix` (vem do webhook) |
| `anotacoes` | `text` | Preenchido com "Baixa automática Asaas · ..." |

#### Estrutura do campo `boleto_dados` (JSONB)

```json
{
  "provider": "ASAAS",
  "billingType": "BOLETO",
  "paymentId": "pay_abc123456",
  "status": "PENDING",
  "barCode": "00190.00009 01234.567890 12345.678901 1 00010000000000",
  "bankSlipUrl": "https://www.asaas.com/b/pdf/...",
  "invoiceUrl": "https://www.asaas.com/i/...",
  "nossoNumero": "00012345",
  "dueDate": "2024-03-15",
  "geradoEm": "2024-03-01T10:30:00.000Z"
}
```

O campo `provider: "ASAAS"` é usado pelo sistema para distinguir de outros métodos de pagamento.

Após a baixa automática, o campo é atualizado e inclui:
```json
{
  "provider": "ASAAS",
  "status": "RECEIVED",
  "valorPago": 1500.00,
  "pagoEm": "2024-03-10T14:22:00.000Z",
  "evento": "PAYMENT_RECEIVED"
}
```

### Tabela `contratos`

| Campo | Tipo | O que armazena |
|---|---|---|
| `cliente_cpf` | `text` | CPF do cliente (obrigatório para boleto) |
| `fintech_dados` | `jsonb` | Dados de integração financeira |

#### Estrutura do campo `fintech_dados` (JSONB)

```json
{
  "asaas_customer_id": "cus_000123456789"
}
```

O `asaas_customer_id` é salvo na primeira vez que um boleto é gerado para o contrato, evitando pesquisas repetidas na API do Asaas.

---

## 12. Segurança do Painel Administrativo

### 12.1 O que foi implementado

O sistema possui múltiplas camadas de segurança:

#### Autenticação
- **Senha com hash PBKDF2-SHA512** — 100.000 iterações, a mesma técnica usada por bancos
- **Tokens de sessão HMAC-SHA256** — assinados criptograficamente, expiram em 24 horas
- **Cookie HttpOnly + Secure + SameSite=Strict** — não pode ser lido por JavaScript, só enviado em HTTPS, protegido contra CSRF

#### Proteção de rotas
- **Middleware Next.js** — intercepta todas as requisições para `/admin/*` e `/api/admin/*`
- Rotas sem sessão válida são **redirecionadas para login** (UI) ou recebem **401 JSON** (API)
- Os webhooks (`/api/webhooks/*`) são propositalmente excluídos da autenticação

#### Rate Limiting no login
- Máximo de **5 tentativas de login por IP** a cada 15 minutos
- Resposta 429 com header `Retry-After` informando quando pode tentar novamente
- Contagem resetada após login bem-sucedido

#### Headers de segurança (HTTP)
- **Content-Security-Policy** — bloqueia scripts e recursos de fontes não autorizadas
- **Strict-Transport-Security** — força HTTPS por 1 ano
- **X-Frame-Options: DENY** — impede o site de ser embutido em iframes (proteção contra clickjacking)
- **X-Content-Type-Options: nosniff** — impede ataques de MIME-type confusion
- **Referrer-Policy** — limita informações enviadas em requisições cross-origin
- **Permissions-Policy** — desativa câmera, microfone, geolocalização

### 12.2 Como alterar a senha do admin

Para gerar um novo hash de senha, execute no terminal:

```bash
node -e "
const c = require('crypto');
const salt = c.randomBytes(32).toString('hex');
const hash = c.pbkdf2Sync('SUA_NOVA_SENHA_AQUI', salt, 100000, 64, 'sha512').toString('hex');
console.log('SALT:', salt);
console.log('HASH:', hash);
"
```

Copie os valores gerados e substitua no `.env` e no Vercel:
```env
ADMIN_PASSWORD_SALT=novo_salt_gerado
ADMIN_PASSWORD_HASH=novo_hash_gerado
```

### 12.3 Gerar novo segredo de sessão

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Substitua `ADMIN_SESSION_SECRET` com o valor gerado. Isso invalidará todas as sessões ativas.

---

## 13. Troubleshooting — Problemas Comuns

### "CPF do cliente é obrigatório"

**Causa:** O contrato não tem o campo CPF preenchido.
**Solução:** Edite o contrato e preencha o CPF do cliente.

---

### "Asaas criar boleto (422): ..."

**Causa:** O CPF informado é inválido, ou há algum dado incorreto.
**Solução:** Verifique se o CPF do cliente está correto (11 dígitos). No sandbox, você pode usar qualquer CPF válido matematicamente.

---

### "Asaas auth failed" ou "access_token inválido"

**Causa:** A variável `ASAAS_API_KEY` está incorreta ou em branco.
**Solução:**
1. Verifique o valor no `.env`
2. Confirme que a chave foi copiada corretamente do painel Asaas
3. Certifique-se que `ASAAS_ENV` está como `sandbox` se estiver usando chave de sandbox

---

### Webhook não funciona (parcelas não são baixadas)

**Causa possível 1:** URL do webhook incorreta no painel Asaas.
**Solução:** Confirme que a URL está exatamente como `https://SEU-SITE.vercel.app/api/webhooks/asaas`

**Causa possível 2:** Token do webhook não bate.
**Solução:** Compare `ASAAS_WEBHOOK_TOKEN` no `.env`/Vercel com o `authToken` configurado no painel Asaas.

**Causa possível 3:** Desenvolvimento local sem URL pública.
**Solução:** Use ngrok para expor o servidor local:
```bash
npx ngrok http 3000
# Use a URL fornecida pelo ngrok como webhook URL no Asaas
```

---

### Boleto gerado mas aparece como "null" no campo linha digitável

**Causa:** No sandbox do Asaas, alguns boletos podem ser gerados sem `barCode` dependendo da configuração da conta.
**Solução:** Verifique o boleto diretamente na fatura (`invoiceUrl`) no painel Asaas. Em produção, isso não ocorre com contas verificadas.

---

### "Parcela não encontrada para payment.id"

**Causa:** O webhook recebeu um evento de um boleto que não está no sistema.
**Solução:** Isso é normal quando há boletos criados diretamente no painel Asaas sem passar pelo sistema. O log exibe o aviso mas não retorna erro.

---

### Aparece erro 401 ao acessar /admin

**Causa:** Sessão expirada ou cookie inválido.
**Solução:** Acesse `/login` e faça login novamente. A sessão dura 24 horas.

---

### Rate limit de login (erro 429)

**Causa:** 5 tentativas de login foram feitas com credenciais erradas nos últimos 15 minutos.
**Solução:** Aguarde 15 minutos. O timer aparece na tela de login com contagem regressiva.

---

## 14. Checklist Final antes de ir ao Ar

### Asaas
- [ ] Conta criada em **app.asaas.com** (produção)
- [ ] Documentos enviados e conta **verificada**
- [ ] Conta bancária cadastrada para receber saques
- [ ] API Key de produção gerada (`$aact_...`)
- [ ] Webhook configurado com a URL de produção
- [ ] Token do webhook anotado

### Variáveis de Ambiente
- [ ] `ASAAS_API_KEY` atualizada com a chave de **produção** no Vercel
- [ ] `ASAAS_WEBHOOK_TOKEN` configurado no Vercel
- [ ] `ASAAS_ENV=production` no Vercel
- [ ] Todas as outras variáveis do `.env` configuradas no Vercel

### Sistema
- [ ] Contratos com CPF dos clientes preenchidos
- [ ] Testar geração de boleto em sandbox antes de ir para produção
- [ ] Testar baixa automática via webhook (pague um boleto no sandbox)
- [ ] Verificar se o PDF do boleto abre corretamente
- [ ] Confirmar que as parcelas são marcadas como pagas automaticamente

### Segurança
- [ ] Arquivo `.env` **não** está no git (verificar `.gitignore`)
- [ ] Senha do admin não é a padrão
- [ ] `ADMIN_SESSION_SECRET` é um valor aleatório único

---

## Glossário

| Termo | Significado |
|---|---|
| **Sandbox** | Ambiente de testes — sem dinheiro real |
| **Production** | Ambiente real — com dinheiro real |
| **Webhook** | Notificação automática enviada pelo Asaas quando algo acontece |
| **Baixa automática** | Marcar parcela como paga sem intervenção manual |
| **Linha digitável** | Código numérico do boleto, usado para pagar em qualquer banco |
| **barCode** | O mesmo que linha digitável na nomenclatura da API Asaas |
| **bankSlipUrl** | URL do PDF do boleto bancário |
| **invoiceUrl** | URL da fatura online do Asaas (página com QR code e linha digitável) |
| **CPF/CNPJ** | Identificador único do cliente, obrigatório para criar boleto |
| **paymentId** | ID único do boleto no sistema Asaas |
| **customerId** | ID único do cliente no sistema Asaas |
| **PBKDF2-SHA512** | Algoritmo criptográfico usado para proteger a senha do admin |
| **HMAC-SHA256** | Algoritmo usado para assinar e validar os tokens de sessão |
