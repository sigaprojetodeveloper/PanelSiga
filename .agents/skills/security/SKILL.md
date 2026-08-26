---
name: security
description: >-
  Diretrizes globais de segurança, RLS do Supabase, RBAC administrativo (admin vs admin_master), proteção XSS/CSRF, headers HTTP e vazamento de segredos no SigaPanelAdmin.
---

# 🛡️ Diretrizes Globais de Segurança, RBAC e Proteção de Dados (SigaPanelAdmin / Web Stack)

Este documento estabelece as diretrizes obrigatórias de segurança da informação, controle de acesso baseado em papéis (RBAC), arquitetura defensiva e conformidade técnica para o painel administrativo web **SigaPanelAdmin** e suas integrações (**Next.js 15**, **React 19**, **Supabase Auth / PostgreSQL**, **Cloudflare R2** e **Edge Functions**).

---

## 📋 Sumário
1. [Filosofia de Segurança & Princípio do Zero-Trust (Web Admin)](#1-filosofia-de-segurança--princípio-do-zero-trust-web-admin)
2. [Autenticação, Sessões & RBAC Administrativo (`admin` vs `admin_master`)](#2-autenticação-sessões--rbac-administrativo-admin-vs-admin_master)
3. [Segurança de Banco de Dados & PostgreSQL RLS para Painel Admin](#3-segurança-de-banco-de-dados--postgresql-rls-para-painel-admin)
4. [Proteção de Variáveis de Ambiente & Isolamento da `service_role` (Next.js)](#4-proteção-de-variáveis-de-ambiente--isolamento-da-service_role-nextjs)
5. [Mitigação de Injeções e Vulnerabilidades Web (XSS, CSRF, SSRF, Clickjacking)](#5-mitigação-de-injeções-e-vulnerabilidades-web-xss-csrf-ssrf-clickjacking)
6. [Uploads Administrativos & Armazenamento Seguro (Cloudflare R2 & Storage)](#6-uploads-administrativos--armazenamento-seguro-cloudflare-r2--storage)
7. [Trilhas de Auditoria (Audit Trail), Logs & Proteção de Privacidade](#7-trilhas-de-auditoria-audit-trail-logs--proteção-de-privacidade)
8. [Checklist Obrigatório de Pre-Deployment (SigaPanelAdmin)](#8-checklist-obrigatório-de-pre-deployment-sigapaneladmin)

---

## 1. Filosofia de Segurança & Princípio do Zero-Trust (Web Admin)

Toda a arquitetura do **SigaPanelAdmin** assume a premissa de que **o navegador (client-side DOM) é um ambiente não confiável**. Qualquer código JavaScript, estado React, token armazenado no cliente ou requisição HTTP pode ser interceptado ou manipulado por atores maliciosos.

* **Regra de Ouro:** Nenhuma validação de permissão ou decisão crítica de negócio deve depender unicamente do estado da interface React (ex: ocultar um botão via CSS ou JS não substitui a validação no servidor/banco).
* **Isolamento de Responsabilidades:** O banco de dados PostgreSQL (via **RLS - Row Level Security**), as **Supabase Edge Functions** e os middlewares/API Routes do Next.js são as autoridades finais e soberanas de autorização e integridade.
* **Menor Privilégio:** Usuários do painel web operam estritamente sob o menor conjunto de privilégios necessários para suas funções funcionais.

---

## 2. Autenticação, Sessões & RBAC Administrativo (`admin` vs `admin_master`)

O **SigaPanelAdmin** diferencia rigidamente operadores operacionais de administradores com privilégios estratégicos/financeiros através da tabela `admin_users`.

### 2.1 Matriz de Hierarquia de Papéis Administrativos

| Papel Administrativo | String no Banco / JWT | Nível Hierárquico | Capacidades e Escopo de Acesso |
| :--- | :--- | :---: | :--- |
| **Administrador Geral** | `admin` | Level 3 (Operacional) | Moderação de denúncias, análise de solicitações de banners/stories, moderação de empresas e obras, visualização de estatísticas. **Sem acesso** a precificação ou gestão de contas de admin. |
| **Administrador Master** | `admin_master` | Level 4 (SuperAdmin) | Privilégios totais do sistema: gestão de contas administrativas (`admin_users`), configuração de regras de precificação (`city_pricings`), regras de descontos por volume (`city_volume_discounts`) e auditorias sensíveis. |

### 2.2 Validação Obrigatória de Papel na Interface e Servidor

1. **Proteção na UI (React Components):**
   Sub-abas restritas (ex: `SettingsTab.tsx -> Monetização` e `SettingsTab.tsx -> Admins`) **devem** validar explicitamente a flag de `admin_master` antes de exibir botões de criação, edição ou exclusão:
   ```tsx
   // Exemplo de verificação de permissão no painel
   const isMasterAdmin = currentAdminUser?.role === 'admin_master';
   if (!isMasterAdmin) {
     return <AccessDeniedMessage message="Acesso restrito a Administradores Master." />;
   }
   ```

2. **Trava contra Autoexclusão de Admin:**
   Um administrador logado no painel **nunca** pode excluir a própria conta ou revogar seu próprio papel `admin_master` (`admin.username === currentAdminUsername` bloqueia a ação na UI e na API).

3. **Gestão de Sessões & JWT:**
   - Tokens JWT de administradores devem possuir tempo de expiração curto (máximo 1 hora) com rotação automática de *Refresh Tokens*.
   - Em caso de alteração de senha ou revogação de permissão em `admin_users`, a sessão deve ser invalidada no Supabase Auth.

---

## 3. Segurança de Banco de Dados & PostgreSQL RLS para Painel Admin

Toda tabela exposta ao PostgREST sob a chave anônima/pública do Supabase depende obrigatoriamente de políticas de **Row Level Security (RLS)** ativas.

### 3.1 Habilitação Obrigatória de RLS
Nenhuma nova tabela em `public` pode ser criada ou modificada sem ter RLS habilitado:
```sql
ALTER TABLE public.nome_da_tabela ENABLE ROW LEVEL SECURITY;
```

### 3.2 Validação de Privilégios Administrativos em RLS

Para operações restritas ao painel administrativo (como moderar denúncias ou aprovar anúncios), as políticas RLS devem verificar a associação do `auth.uid()` com a tabela `admin_users`:

```sql
-- Exemplo: Função auxiliar SECURITY DEFINER para verificar se o usuário atual é admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = user_id AND status = 'ACTIVE'
  );
$$;

-- Política de RLS restrita a administradores
CREATE POLICY "Apenas administradores podem atualizar status de denúncias"
ON public.reports FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
```

### 3.3 Funções RPC com `SECURITY DEFINER` Estritas
- Funções em PL/pgSQL que utilizem `SECURITY DEFINER` executam com privilégios do criador.
- **Regra:** Sempre defina explicitamente `SET search_path = public` para evitar ataques de manipulação de `search_path`.
- **Regra:** Valide os argumentos de entrada e verifique `is_admin()` antes de executar operações de escrita sensíveis.
- **Regra:** Proibição absoluta de concatenação de strings para SQL dinâmico em RPCs; utilize consultas parametrizadas estáticas ou `EXECUTE ... USING`.

### 3.4 Coexistência com o Siga Mobile (Banco de Dados Compartilhado)

> [!WARNING]
> **Atenção RLS - Arquitetura de Banco Compartilhado (Siga Mobile & SigaPanelAdmin):**
> O banco de dados PostgreSQL do Supabase é **único e compartilhado** entre o aplicativo **Siga Mobile** e o **SigaPanelAdmin**. Qualquer alteração nas tabelas ou políticas de RLS afeta diretamente ambos os ambientes.

1. **Políticas Aditivas (Permissivas via `OR`):**
   No PostgreSQL RLS, múltiplas políticas permissivas para a mesma ação (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) na mesma tabela são combinadas via operador `OR`. Ao criar ou atualizar políticas para o **SigaPanelAdmin**, **nunca** remova ou restrinja as políticas de acesso do **Siga Mobile** (`cliente`, `profissional`, `enterprise_owner` e `anon`).

2. **Exemplo de Coexistência Saudável na Tabela `reports` (Denúncias):**
   ```sql
   -- Política Siga Mobile (Usuário comum lê apenas denúncias criadas por ele):
   CREATE POLICY "Usuário lê próprias denúncias"
   ON public.reports FOR SELECT
   TO authenticated
   USING (reporter_id = auth.uid());

   -- Política SigaPanelAdmin (Administrador no painel web lê TODAS as denúncias):
   CREATE POLICY "Admin lê todas as denúncias"
   ON public.reports FOR SELECT
   TO authenticated
   USING (public.is_admin(auth.uid()));
   ```
   *As duas políticas coexistem via `OR`. O usuário mobile acessa apenas suas denúncias, e o admin no SigaPanelAdmin acessa o volume completo para moderação, sem qualquer conflito.*

3. **Perigo Extremo de Políticas Restritivas (`AS RESTRICTIVE`):**
   - **NUNCA** utilize `AS RESTRICTIVE` em políticas administrativas genéricas. Políticas restritivas aplicam uma conjunção `AND` obrigatória sobre todas as outras regras. Se uma política `AS RESTRICTIVE` exigir `public.is_admin(auth.uid())`, **ela irá bloquear imediatamente 100% dos acessos de usuários do aplicativo Siga Mobile!**

4. **Proteção contra Elevação de Privilégios no Mobile:**
   - Garantir que permissões de edição de status concedidas a admins (ex: `banners.status = 'APPROVED'`, `users.status = 'BLOCKED'`, `verification_level`) possuam `WITH CHECK` que impeçam o usuário do Siga Mobile de alterar essas colunas sensíveis em seus próprios registros.

---

## 4. Proteção de Variáveis de Ambiente & Isolamento da `service_role` (Next.js)

No Next.js 15, qualquer variável injetada no arquivo `next.config.ts` sob a chave `env` ou com o prefixo `NEXT_PUBLIC_` é **compilada diretamente nos arquivos JavaScript públicos servidos ao navegador**.

### 4.1 Proibição Absoluta do Vazamento da `service_role`
* A chave `SUPABASE_SERVICE_ROLE_KEY` bypassa 100% das políticas de RLS e possui acesso ilimitado de gravação e exclusão no banco de dados.
* **PROIBIÇÃO:** A chave `SUPABASE_SERVICE_ROLE_KEY` **NUNCA** pode estar em `next.config.ts -> env`, **NUNCA** pode ter prefixo `NEXT_PUBLIC_` e **NUNCA** pode ser importada em componentes React Client Component (`'use client'`).
* **Uso Seguro:** Se necessária, a `service_role` deve ser utilizada **exclusivamente** em rotas de API Server-Side do Next.js (`src/app/api/...`) ou em **Supabase Edge Functions**, com autenticação previa e estrita do administrador logado.

### 4.2 Configuração Segura de Variáveis Públicas
Apenas a URL do Supabase (`SIGA_SUPABASE_URL`) e a chave anônima pública (`SIGA_SUPABASE_ANON_KEY`) podem ser expostas para o cliente web frontend.

```typescript
// src/lib/supabase.ts (Apenas chaves públicas)
const supabaseUrl = process.env.SIGA_SUPABASE_URL;
const supabaseAnonKey = process.env.SIGA_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas no SigaPanelAdmin.');
}
```

---

## 5. Mitigação de Injeções e Vulnerabilidades Web (XSS, CSRF, SSRF, Clickjacking)

### 5.1 Prevenção contra Cross-Site Scripting (XSS)
* **Escaping Nativo do React 19:** O React 19 já realiza a sanitização padrão de expressões JSX (`{content}`).
* **Proibição de `dangerouslySetInnerHTML`:** Evite o uso de `dangerouslySetInnerHTML`. Caso seja estritamente necessário para preview de anúncios ou HTML formatado de relatórios, utilize uma biblioteca de sanitização estrita (como `DOMPurify` com whitelist fechada de tags).
* **Sanitização de URLs:** Ao renderizar links externos fornecidos por lojistas ou anúncios (ex: `website_url`), valide se o esquema é `https://` para evitar injeções `javascript:alert(1)`.

### 5.2 Prevenção contra Cross-Site Request Forgery (CSRF) & SameSite Cookies
* Operações de alteração de estado vindas do cliente web devem utilizar cabeçalhos HTTP autenticados (`Authorization: Bearer <JWT>`) gerenciados pelo SDK do Supabase ou cookies de sessão com atributos `SameSite=Lax` ou `Strict` e `Secure`.

### 5.3 HTTP Security Headers (Next.js Config / Middleware)
O painel administrativo deve incluir cabeçalhos HTTP estritos de segurança no `next.config.ts` para mitigar ataques no navegador:

```typescript
// Configuração recomendada de headers no Next.js
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' }, // Prevenção contra Clickjacking
  { key: 'X-Content-Type-Options', value: 'nosniff' }, // Impede Mime Sniffing
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];
```

### 5.4 Prevenção contra Server-Side Request Forgery (SSRF)
Ao disparar requisições do servidor do painel ou de Edge Functions para APIs de terceiros (ex: webhooks de pagamento ou validação de domínios):
* Valide e restrinja as URLs de destino a um protocolo `https` seguro.
* Bloqueie chamadas direcionadas a IPs privados ou locais (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, `169.254.169.254`).

### 5.5 Rate Limiting Centralizado no Supabase & Proteção contra Força Bruta

A responsabilidade primária de **Rate Limiting** é delegada à camada de infraestrutura e dados do **Supabase** (Auth, PostgreSQL e Edge Functions), garantindo proteção simultânea e centralizada tanto para o **SigaPanelAdmin** quanto para o **Siga Mobile**.

1. **Camada 1: Supabase Auth Rate Limits (Proteção Obrigatória de Login):**
   - Endpoints de autenticação (`/auth/v1/token`, `/auth/v1/recover`) devem ser configurados no Supabase Dashboard (**Authentication $\rightarrow$ Rate Limits**) com limite estrito de **5 a 10 requisições por minuto por IP**.
   - Recuperação de senha limitada a **3 e-mails por hora** por usuário para mitigar *email spamming* e DoS.
   - O Supabase descarta requisições excedentes na borda, retornando status `HTTP 429 Too Many Requests`.

2. **Camada 2: Rate Limiting no Banco de Dados (PostgreSQL RPCs para Mutações Sensíveis):**
   - Ações de alto impacto executadas por administradores (ex: criação/exclusão em `admin_users`, alteração de regras de precificação em `city_pricings`, moderação em massa) utilizam controle de taxa nativo em PL/pgSQL via tabela `rate_limits` ou funções de trava de janela deslizante (limite de 10 a 15 req/min por administrador).

3. **Camada 3: Rate Limiting em Supabase Edge Functions (`r2-storage` / `stripe-payment`):**
   - Edge Functions que emitem Presigned URLs de upload ou iniciam checkouts Stripe aplicam controle de vazão por token JWT/IP antes de acionar provedores externos (Cloudflare R2 / Stripe).

4. **Camada 4: Tratamento Amigável de Erros `429` no Frontend (Next.js & Mobile):**
   - As aplicações clientes (Web Admin e Mobile) devem capturar especificamente o erro `429` do Supabase e apresentar uma mensagem clara ao usuário (ex: *"Muitas solicitações enviadas em curto intervalo. Aguarde alguns instantes antes de tentar novamente."*), prevenindo que a UI entre em estado inconsistente ou trave o operador.

---

## 6. Uploads Administrativos & Armazenamento Seguro (Cloudflare R2 & Storage)

O **SigaPanelAdmin** lida com o gerenciamento e upload de mídias institucionais, banners publicitários e imagens de destaque de empresas.

### 6.1 Fluxo Seguro de Upload via Presigned URLs
1. O painel web **não** deve guardar chaves mestre de escrita do Cloudflare R2 / AWS S3 no código do frontend.
2. O upload deve solicitar autorização prévia enviando os metadados do arquivo para a Edge Function `r2-storage` ou bucket seguro do Supabase Storage.
3. O servidor/Edge Function verifica o token JWT e a permissão do administrador (`is_admin()`), retornando uma **Presigned URL** temporária com validade máxima de 5 minutos.
4. O frontend envia a mídia diretamente para a URL pré-assinada.

### 6.2 Validação e Sanitização de Arquivos
* **Validação por Tipo MIME Real:** Bloqueie extensões com base na assinatura binária (magic bytes) e `Content-Type`. Aceitar apenas extensões de imagem/vídeo permitidas (`.png`, `.jpeg`, `.webp`, `.mp4`).
* **Proibição Total de Scripts Executáveis:** É estritamente proibido o upload de arquivos `.html`, `.htm`, `.svg` não sanitizados, `.js`, `.php` ou arquivos executáveis que possam resultar em **XSS Stored** quando acessados via CDN.
* **Tamanho Máximo:** Impor limites rígidos no cliente e servidor (ex: no máximo 5MB para imagens de banners e 20MB para vídeos de stories).

---

## 7. Trilhas de Auditoria (Audit Trail), Logs & Proteção de Privacidade

### 7.1 Trilha de Auditoria Obrigatória para Ações Administrativas
Qualquer ação de moderação, alteração financeira ou mudança de status no **SigaPanelAdmin** deve registrar uma trilha de auditoria contendo:
- `admin_id`: Identificador do administrador executor;
- `action`: Tipo de ação (`APPROVE_BANNER`, `BLOCK_ENTERPRISE`, `UPDATE_PRICING`, `DELETE_REPORT`);
- `target_id`: ID da entidade alterada;
- `created_at`: Carimbo de data/hora oficial do servidor (nunca do cliente web);
- `details`: Objeto JSON com os valores alterados (ex: status anterior e status atual).

### 7.2 Sanitização e Higiene de Logs
* **Proibição de Logs Sensíveis:** Nunca imprima no `console.log` do navegador ou servidor: tokens JWT, senhas de administradores, payloads contendo dados bancários/Stripe ou informações PII de usuários.
* **Ofuscação de Erros para o Usuário Final:** Mensagens de erro de exceções do banco de dados (ex: *PostgreSQL syntax trace*, violações de chaves estrangeiras) **nunca** devem ser expostas diretamente nos alertas da interface. Exiba mensagens amigáveis (ex: *"Erro ao processar alteração. Tente novamente."*) e registre o erro técnico detalhado apenas no log seguro de backend.

---

## 8. Checklist Obrigatório de Pre-Deployment (SigaPanelAdmin)

Antes de realizar o deploy de qualquer atualização do **SigaPanelAdmin** em produção:

- [ ] A chave `SUPABASE_SERVICE_ROLE_KEY` está 100% isolada e fora dos arquivos do frontend web, do `next.config.ts` e de repositórios públicos?
- [ ] As telas/abas de **Monetização** e **Admins** possuem checagem estrita de papel `admin_master` tanto no frontend quanto no RLS/servidor?
- [ ] Todas as novas tabelas e funções RPC criadas ou alteradas possuem RLS ativo com verificação `is_admin()`?
- [ ] As políticas de RLS novas ou modificadas foram testadas para garantir que NÃO afetam nem bloqueiam os acessos dos usuários do aplicativo **Siga Mobile** (coexistência via `OR` sem uso indevido de `AS RESTRICTIVE`)?
- [ ] Os cabeçalhos de segurança HTTP (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`) estão configurados?
- [ ] Não há usos não sanitizados de `dangerouslySetInnerHTML` ou injeções de URLs `javascript:` na interface React?
- [ ] O upload de mídias (banners/stories) é validado por tipo MIME e realizado via Presigned URLs com expiração curta?
- [ ] O sistema de auditoria está capturando as ações de moderação e alterações de status efetuadas pelos administradores?
- [ ] O Rate Limiting e a proteção por CAPTCHA/Turnstile estão ativos nos fluxos de autenticação do Supabase Auth e nas rotas de mutação do painel admin?
- [ ] Todos os `console.log` de debug contendo dados de requisições foram removidos ou desativados para o build final?
