# PRD — Siga App
**Product Requirements Document**
**Versão:** 1.1.0
**Status:** Atualizado
**Última atualização:** 2026-03-06
**Stack Core:** Supabase (Auth, DB, Edge Functions) · Cloudflare R2 (Storage) · react-pdf (geração de PDF client-side)

---

## Índice

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Objetivos e Métricas de Sucesso](#2-objetivos-e-métricas-de-sucesso)
3. [Personas e Papéis](#3-personas-e-papéis)
4. [Escopo do Produto](#4-escopo-do-produto)
5. [Arquitetura de Navegação](#5-arquitetura-de-navegação)
6. [Módulo: Autenticação e Onboarding](#6-módulo-autenticação-e-onboarding)
7. [Módulo: Perfil e Edição](#7-módulo-perfil-e-edição)
8. [Módulo: Obras](#8-módulo-obras)
9. [Módulo: Orçamentos](#9-módulo-orçamentos)
10. [Módulo: Loja](#10-módulo-loja)
11. [Módulo: Home](#11-módulo-home)
12. [Módulo: Denúncia](#12-módulo-denúncia)
13. [Módulo: Configurações](#13-módulo-configurações)
14. [Infraestrutura e Stack Técnica](#14-infraestrutura-e-stack-técnica)
15. [Schema do Banco de Dados (Supabase)](#15-schema-do-banco-de-dados-supabase)
16. [Requisitos Não-Funcionais](#16-requisitos-não-funcionais)
17. [Integrações Back-end](#17-integrações-back-end)
18. [Critérios de Pronto (DoD)](#18-critérios-de-pronto-dod)
19. [Fora do Escopo (v1)](#19-fora-do-escopo-v1)

---

## 1. Visão Geral do Produto

O **Siga App** é um marketplace mobile que conecta **Clientes** (proprietários de obras) a **Profissionais** (prestadores de serviços da construção civil). A plataforma cobre todo o ciclo de contratação: descoberta, solicitação de obra, envio e aceitação de propostas, geração de orçamentos, assinatura de contrato e pagamento.

A infraestrutura é **100% Serverless**, mantendo custo fixo próximo de zero na fase inicial: Supabase como backend e auth, Cloudflare R2 para armazenamento de arquivos (egresso gratuito) e `react-pdf` para geração de PDFs no dispositivo do usuário.

### Problema
Proprietários de obras têm dificuldade em encontrar profissionais qualificados na sua região; profissionais têm pouca visibilidade e ferramentas para formalizar propostas e orçamentos.

### Solução
Um app que centraliza perfil profissional, portfólio de obras, geração de orçamentos em PDF, busca geográfica e fluxo de contratação estruturado — com camadas de segurança e mecanismo de denúncia para manter a integridade da plataforma.

---

## 2. Objetivos e Métricas de Sucesso

| Objetivo | KPI | Meta v1 |
|---|---|---|
| Crescimento de base | Cadastros concluídos (onboarding completo) | — |
| Engajamento de Profissionais | Orçamentos gerados / Profissional / mês | ≥ 2 |
| Engajamento de Clientes | Obras criadas / Cliente ativo | ≥ 1 |
| Conversão | Propostas aceitas / Propostas enviadas | > 20% |
| Segurança | Denúncias resolvidas em até 48h | 90% |
| Qualidade técnica | Crash-free sessions | ≥ 99,5% |

---

## 3. Personas e Papéis

### 3.1 Cliente
- Possui imóvel ou obra em andamento.
- Cria solicitações de obra com escopo, fotos e documentos.
- Recebe propostas de profissionais, aceita ou recusa.
- Assina contrato e efetua pagamento.
- Pode acumular papel de Profissional no mesmo cadastro.

### 3.2 Profissional
- Prestador de serviços da construção civil (pedreiro, encanador, eletricista etc.).
- Mantém perfil com portfólio, especializações e cobertura geográfica.
- Encontra obras disponíveis e envia propostas com orçamentos.
- Gera orçamentos em PDF.

> **Regra de negócio:** Um usuário pode ser Cliente **e** Profissional simultaneamente. O papel ativo determina o painel exibido na Home e as ações disponíveis nas telas.

---

## 4. Escopo do Produto

### Incluído na v1
- Autenticação via Google (login e cadastro)
- Onboarding: dados pessoais, endereços, especializações (Profissional)
- Perfil próprio e de terceiros com deep links sociais
- CRUD de Obras (Cliente) + propostas (Profissional)
- CRUD de Orçamentos com geração de PDF
- Home com busca, stories, anúncios e painel por papel
- Loja por cidade
- Denúncia de usuários, obras, propostas, orçamentos e conteúdo
- Configurações (estrutura base)

### Fora do Escopo (v1)
- Pagamento in-app (link externo)
- Assinatura digital de contrato in-app
- Chat/mensageria
- Avaliações e reviews
- Painel administrativo web
- Notificações push avançadas

---

## 5. Arquitetura de Navegação

### 5.1 Roteamento Condicional na Abertura

```
App aberto
  ├── Sessão válida
  │     ├── Perfil completo → Home
  │     └── Perfil incompleto
  │           ├── Sem dados pessoais/documento → Informações do Usuário
  │           ├── Sem endereços → Cadastro de Endereços
  │           └── Profissional sem especializações → Especializações
  └── Sem sessão → Login
```

### 5.2 Bottom Navigation (Global)

| Ícone | Destino | Visibilidade |
|---|---|---|
| Home | Tela Home | Todos |
| Obras | Lista de Obras | Todos |
| Orçamentos | Lista de Orçamentos | Profissional |
| Perfil | Meu Perfil | Todos |
| Loja | Tela Loja | Todos |

### 5.3 Fluxo de Obra (Timeline)

```
Obra criada (Cliente)
  → Proposta enviada (Profissional)
    → Proposta aceita (Cliente)
      → Contrato gerado
        → Pagamento efetuado
          → Contrato firmado
```

---

## 6. Módulo: Autenticação e Onboarding

### 6.1 Tela de Abertura (Splash)

**Objetivo:** Exibir branding e rotear o usuário conforme estado de sessão.

| Campo | Detalhe |
|---|---|
| Componentes | Logotipo animado (splash) |
| Fluxo | Animação → verificar sessão → Home ou Login |
| Erros | Falha de leitura de sessão → redirecionar para Login |
| Telemetria | `app_opened`, `splash_completed` |

---

### 6.2 Tela de Login

**Objetivo:** Autenticar usuário existente via Google.

**Componentes:**
- Título: "Login" / Subtítulo: "Bem-vindo"
- Botão: "Logar com Google"
- Checkbox: "Lembrar-me"
- Link: "Ainda não tenho cadastro" → Criar Conta

**Fluxo:**
1. Usuário toca "Logar com Google".
2. App aciona o provider Google via **Supabase Auth (GoTrue)**.
3. Supabase valida o token Google, cria/recupera sessão e retorna `access_token` + `refresh_token`.
4. Se "Lembrar-me": persistir tokens em Keychain/SecureStore.
5. Redirecionar conforme estado do perfil (ver seção 5.1).

**Validações:**
- Email retornado pelo Google deve ser verificado.
- Botão em estado de loading (spinner + desabilitado) durante a chamada.

**Mensagens de erro:**
- `"Credenciais não encontradas, faça o cadastro."`
- `"Erro ao fazer o login, tente novamente mais tarde."`

**Critérios de aceite:**
- Token armazenado em memória; se "Lembrar-me", também em armazenamento seguro.
- Com sessão persistida, o Login é pulado no próximo acesso.

---

### 6.3 Tela Criar Conta

**Objetivo:** Registrar novo usuário via Google com aceite de Termos.

**Componentes:**
- Botão Voltar
- Título: "Crie sua Conta"
- Botão: "Cadastrar com Google" (habilitado somente após checkbox)
- Checkbox obrigatório: aceite de Termos e Política de Privacidade
- Link para Tela de Termos

**Fluxo:**
1. Usuário marca checkbox de aceite.
2. Toca "Cadastrar com Google".
3. **Supabase Auth** cria conta via provider Google e retorna sessão (`access_token` / `refresh_token`).
4. App insere registro inicial na tabela `profiles` com `id = auth.uid()`.
5. Redirecionar para Informações do Usuário.

**Mensagens de erro:**
- `"Erro ao criar nova conta, tente novamente mais tarde."`
- `"Você já possui conta cadastrada, faça o Login."` + CTA para Login.

**Critérios de aceite:**
- Impedir cadastro sem aceite dos Termos.
- Usuário existente → oferecer ação de Login.

---

### 6.4 Tela de Termos

**Objetivo:** Exibir Termos de Uso e Política de Privacidade.

| Item | Detalhe |
|---|---|
| Conteúdo | Texto com scroll; suporte a links externos |
| Versionamento | Registrar versão exibida + timestamp no aceite (auditoria) |
| Ação | Botão "Voltar" |

---

### 6.5 Tela Informações do Usuário

**Objetivo:** Coletar dados pessoais e tipo de usuário.

**Campos:**

| Campo | Tipo | Regras |
|---|---|---|
| Nome completo | Input (editável) | Pré-preenchido via Google; mín. 3 caracteres |
| Email | Input (somente leitura) | Consistente com conta Google |
| Tipo de documento | Radiogroup: CPF \| CNPJ | Obrigatório |
| Número do documento | Input condicional | Exibido após seleção no radiogroup; máscara dinâmica; validar dígitos verificadores |
| Tipo de usuário | Checkbox múltipla: Cliente \| Profissional | Mínimo 1 selecionado |

**Máscaras:**
- CPF: `000.000.000-00`
- CNPJ: `00.000.000/0000-00`
- Remover máscara antes de enviar ao back-end.

**Mensagens de erro:**
- `"CPF inválido"` / `"CNPJ inválido"`
- Erros de campo obrigatório em linha.

---

### 6.6 Tela Cadastro de Endereços

**Objetivo:** Registrar endereço base e, para Profissionais, cobertura geográfica de atuação.

#### Seção A — Cobertura de Atuação *(somente Profissional)*

**Componentes:**
- Checkbox: "Atuar em todo o Brasil" (desabilita gerenciamento manual ao marcar)
- Botão: "Gerenciar cobertura" → abre Modal Híbrido
- Resumo em chips: ex. `SP · Todo o estado`, `RJ · 12 cidades`
- Contador: `"Cobertura: 5 estados (3 completos, 2 com 12 cidades)"`
- Menu de contexto por chip: `"Converter para todo o estado"`, `"Editar cidades"`, `"Remover estado"`

**Modal Híbrido — Gerenciar Cobertura** *(bottom sheet com duas abas)*

*Aba "Estados":*
- Busca por UF/nome
- Lista com checkbox múltiplo
- Ações: "Selecionar todos", "Limpar"
- Salvar: adiciona estados como "Todo o estado" + snackbar com CTA "Ir para Cidades"

*Aba "Cidades":*
- Select de Estado (obrigatório, persiste entre navegações na aba)
- Busca por nome de cidade; lista com checkbox múltiplo
- Ações: "Selecionar todas as cidades deste estado", "Limpar"
- Salvar: se estado inexistente na cobertura → adicionar automaticamente; se estava "Todo o estado" → solicitar confirmação de conversão

**Regras de granularidade:**
- `"Todo o Brasil"` marcado → limpar seleções manuais (com confirmação).
- Adicionar cidades a estado com "Todo o estado" → solicitar conversão para "cidades específicas".
- Desmarcar estado na aba "Estados" → remove do objeto de cobertura.

**Estrutura de persistência — Cobertura:**
```json
// Todo o Brasil
{ "nationwide": true, "coverage": [] }

// Por Estados/Cidades
{
  "nationwide": false,
  "coverage": [
    { "uf": "SP", "entire_state": true, "cities": [] },
    { "uf": "RJ", "entire_state": false, "cities": ["Rio de Janeiro", "Niterói"] }
  ]
}
```

#### Seção B — Endereço Base *(todos os perfis)*

| Campo | Tipo | Obrigatório |
|---|---|---|
| País | Select (default: Brasil) | Sim |
| Estado (UF) | Select | Sim |
| Cidade | Select | Sim |
| Bairro | Input livre | Não |
| Logradouro | Input livre | Sim |
| Número | Input (somente dígitos) | Sim |
| Complemento | Input livre | Não |

> Sem CEP e sem auto-preenchimento de logradouro.

**Estrutura de persistência — Endereço:**
```json
{
  "address": {
    "country": "Brasil",
    "state": "SP",
    "city": "São Paulo",
    "district": "Bela Vista",
    "street": "Av. Paulista",
    "number": "1000",
    "complement": "Conj. 101"
  }
}
```

**Validações:**
- Profissional: "Todo o Brasil" **ou** ≥ 1 estado na cobertura; estados com cidades específicas devem ter ≥ 1 cidade.
- Cliente: País, Estado, Cidade, Logradouro e Número obrigatórios.

**Mensagens de erro:**
- `"Marque 'Atuar em todo o Brasil' ou selecione pelo menos um estado."`
- `"Selecione ao menos uma cidade para o estado {UF} ou ative 'Todo o estado'."`
- `"Erro ao salvar, tente novamente."`

---

### 6.7 Tela Especializações *(somente Profissional)*

**Objetivo:** Profissional seleciona suas especialidades.

| Item | Detalhe |
|---|---|
| API (leitura) | `GET /specialties` |
| API (escrita) | `PUT /user/profile/specialties` |
| Componentes | Lista com checkbox + scroll; botão "Salvar Especialidades" |
| Validação | Recomendado ≥ 1 seleção; 0 permitido (confirmar regra de negócio) |
| Sucesso | Navegar para Home |
| Erro | `"Erro ao salvar especialidades, tente novamente."` |

---

## 7. Módulo: Perfil e Edição

### 7.1 Meu Perfil *(isCurrentUser = true)*

**API:** `GET /user/profile/{id}`

**Componentes:**
- Card de cabeçalho: foto, nome, descrição, avaliação, botão "Editar perfil"
- Abas horizontais (ícone + texto):

| Aba | Conteúdo | Profissional | Cliente |
|---|---|---|---|
| Obras | Até 10 imagens com descrição e zoom | ✓ | — |
| Especializações | Lista de especialidades | ✓ | — |
| Endereços | Lista de endereços | ✓ | ✓ |
| Contato | Telefone com deep link WhatsApp | ✓ | ✓ |
| Instagram | @handle com deep link | ✓ | ✓ |
| Facebook | @handle com deep link | ✓ | ✓ |

**Deep links:**

| Rede | Link nativo | Fallback web |
|---|---|---|
| WhatsApp | `whatsapp://send?phone=` | `https://wa.me/` |
| Instagram | `instagram://user?username=` | `https://instagram.com/` |
| Facebook | `fb://profile/` | `https://facebook.com/` |

> Denúncia **não** é exibida no Meu Perfil.

---

### 7.2 Perfil de Terceiros *(isCurrentUser = false)*

- Mesmas abas, sem botões de edição.
- Menu "..." no card de cabeçalho → **"Denunciar usuário"** → Tela Denúncia (`target.type = user`).

---

### 7.3 Telas de Edição

| Tela | API | Campos editáveis |
|---|---|---|
| Editar Perfil | `PATCH /user/profile` | Foto, nome (≥ 3 chars), descrição (limite de chars) |
| Editar Obras | `PUT/POST/DELETE /user/profile/works` | Imagens (máx. 10, formatos válidos), descrição |
| Editar Especializações | `PUT /user/profile/specialties` | Lista com busca e seleção múltipla |
| Editar Endereços | `POST/PUT/DELETE /user/profile/addresses` | Reusa componente de endereços (seção 6.6) |
| Editar Instagram | `PATCH /user/profile` | @handle (validar formato) |
| Editar Facebook | `PATCH /user/profile` | @handle (validar formato) |

---

## 8. Módulo: Obras

### 8.1 Lista de Obras

**API:** `GET /works?role=professional|client&status=...` (paginação + filtros)

**Cards exibem:** nome do cliente/profissional, cidade, avaliação, descrição resumida, data de início, status atual.

**Status possíveis:** proposta enviada/recebida, contrato assinado/não assinado.

---

### 8.2 Detalhes da Obra

**APIs:**
- `GET /works/{id}`
- `GET /works/{id}/proposals` (Cliente)
- `GET /works/{id}/contracts`

**Componentes e regras por papel:**

| Componente | Cliente dono | Profissional não dono | Outros |
|---|---|---|---|
| Card do cliente | — | Visível (com menu "Denunciar usuário") | — |
| Editar escopo | ✓ (se sem proposta aceita) | — | — |
| Botão "Estou disponível" | — | ✓ (ofuscado após envio) | — |
| Lista de propostas recebidas | ✓ | — | — |
| Aceitar/Recusar proposta | ✓ | — | — |
| Contrato + Pagamento | ✓ (após aceitar) | ✓ (após aceitar) | — |
| Anexar PDF de projeto | ✓ | — | — |
| Anexar orçamento | — | ✓ | — |

**Regra crítica:** Alterar detalhes da obra quando há propostas **pendentes** invalida essas propostas. O usuário deve ser alertado antes de confirmar a edição.

**Links de Denúncia na tela:**

| Local | Ação | Target |
|---|---|---|
| TopBar "..." | Denunciar obra | `work / {workId}` |
| Card do cliente (visto por profissional) | Denunciar usuário | `user / {clientUserId}` |
| Card de proposta (visto pelo cliente) | Denunciar proposta | `proposal / {proposalId}` |
| Viewer de mídia | Denunciar conteúdo | `content / {mediaId}` |
| Orçamento anexado | Denunciar orçamento | `budget / {budgetId}` |

---

### 8.3 Cadastro / Edição de Obra

**APIs:** `POST /works`, `PUT /works/{id}`

**Campos:**

| Campo | Tipo | Regras |
|---|---|---|
| Datas início/término | Date picker | Início ≤ término |
| Endereço | Componente de endereço | Campos essenciais obrigatórios |
| Tipo de serviço | Select | — |
| Serviços e metragens | Lista composta (múltiplos itens) | Adicionar/remover |
| Observações | Textarea | Opcional |
| Fotos | Galeria (máx. 5) | jpg/png; limite de tamanho |
| PDF do projeto | Upload | Opcional |

---

## 9. Módulo: Orçamentos

### 9.1 Lista de Orçamentos *(Profissional)*

**API:** `GET /budgets`

**Cards:** cliente, data, valor total. Ações por card: "Gerar PDF", "Editar", "Excluir" (bloqueado se vinculado a obra fechada).

---

### 9.2 Criar / Editar Orçamento

**APIs (Supabase):** `INSERT/UPDATE budgets`, upload de PDF para R2 via presigned URL.

**Geração de PDF:** realizada no dispositivo via `react-pdf`. O arquivo gerado é enviado ao bucket `orçamentos` no Cloudflare R2 e a URL pública é salva no campo `pdf_url` da tabela `budgets`.

**Campos:**

| Campo | Tipo | Regras |
|---|---|---|
| Nome do cliente | Input | Obrigatório |
| Data de validade | Date picker | Obrigatório |
| Itens | Lista dinâmica | Popup por item (ver abaixo) |
| Subtotal | Calculado (read-only) | Soma dos itens |
| Desconto | Input numérico | Opcional |
| Valor total | Calculado (read-only) | Subtotal − Desconto |

**Popup de item:**
- Descrição, quantidade, unidade, valor unitário, checkbox "desconto aplicável".

**Validações:** campos numéricos; cálculos consistentes entre tela e PDF.

---

### 9.3 Exibir Orçamento

- Visual consistente com a versão PDF.
- Ação "Gerar PDF".
- Se acessado pelo Cliente via Detalhes da Obra: menu "..." → **"Denunciar orçamento"**.

---

## 10. Módulo: Loja

**API:** `GET /stores?city=...`

**Cards:** imagem, nome, descrição, telefone/WhatsApp (tap → ligar ou abrir WhatsApp).

---

## 11. Módulo: Home

### 11.1 Componentes Comuns

| Componente | Detalhe |
|---|---|
| TopBar | Imagem do sistema, nome do usuário, ícone sino |
| Busca | Por Cidade/UF — correspondência exata de string (`WHERE city = '...' AND state = '...'`); sem PostGIS |
| Stories | Lista horizontal; imagens/vídeos com zoom |
| Anúncios | Card rotativo (~1,5s); clique abre link externo |

### 11.2 Painel por Papel

**Profissional:**
- "Serviços disponíveis" → cards de obras → Detalhes da Obra.

**Cliente:**
- "Minhas obras" com cidades em carrossel horizontal.
- Lista de propostas recebidas com ações:
  - Aceitar → `POST /proposals/{id}/accept`
  - Recusar → `POST /proposals/{id}/refuse`
  - Tap na foto do profissional → Perfil
  - Tap no orçamento → Tela Orçamento

---

## 12. Módulo: Denúncia

### 12.1 Pontos de Entrada

| Tela de origem | Elemento | Alvo |
|---|---|---|
| Perfil (terceiros) | Menu "..." no card de cabeçalho | `user` |
| Detalhes da Obra — TopBar | Menu "..." | `work` |
| Detalhes da Obra — Card cliente | Menu "..." | `user` |
| Detalhes da Obra — Card proposta | Menu "..." | `proposal` |
| Viewer de mídia | Menu "..." | `content` |
| Orçamento (preview) | Menu "..." | `budget` |

> Denúncia **nunca** aparece no Meu Perfil (próprio usuário).

### 12.2 Tela de Denúncia

**Componentes:**

| Campo | Tipo | Regras |
|---|---|---|
| Contexto | Read-only (tipo + ID do alvo) | Preenchido automaticamente pela origem |
| Motivo | Select obrigatório | Assédio/ofensa, Fraude, Spam, Conteúdo impróprio, Discriminação, Violação de direitos autorais, Outro |
| Descrição | Textarea (máx. 1000 chars) | Opcional; obrigatória quando motivo = "Outro" |
| Anexos | Upload múltiplo | Máx. 3 arquivos; jpg/png/pdf; máx. 5 MB por arquivo |
| Permitir contato do suporte | Checkbox | Opcional |

**Fluxo:**
1. Validar campos.
2. `POST /reports` com payload completo.
3. Sucesso → toast: `"Recebemos sua denúncia. Obrigado por ajudar a manter a plataforma segura."` → retornar à tela de origem.

**Payload:**
```json
{
  "target": { "type": "user|work|proposal|budget|content", "id": "..." },
  "category": "fraud|abuse|spam|hate|ip_violation|other",
  "description": "texto opcional",
  "attachments": [{ "url": "signed-url-or-id", "type": "image|pdf" }],
  "allow_contact": true
}
```

**Anti-spam:** rate limit de 3 denúncias / 10 min por usuário.

**Mensagens de erro:**
- `"Selecione um motivo da denúncia."`
- `"Descrição é obrigatória para a categoria selecionada."`
- `"Formato de arquivo não suportado."`
- `"Arquivo excede o tamanho máximo permitido."`
- `"Não foi possível enviar sua denúncia. Tente novamente mais tarde."`

---

## 13. Módulo: Configurações

> **A detalhar em v1.1:** preferências de notificação, idioma, segurança (logout, alteração de senha), privacidade, exclusão de conta.

---

## 14. Infraestrutura e Stack Técnica

| Camada | Tecnologia | Responsabilidade |
|---|---|---|
| Auth | Supabase Auth (GoTrue) | Login Google, sessões, JWT, refresh token |
| Banco de dados | Supabase PostgreSQL | Todas as tabelas relacionais; RLS por `auth.uid()` |
| Edge Functions | Supabase Edge Functions (Deno) | Lógica server-side quando necessário (ex.: rate limit de denúncias) |
| Storage | Cloudflare R2 | Fotos de obras, avatares, PDFs de orçamentos (egresso gratuito) |
| PDF | `react-pdf` (client-side) | Geração de orçamentos PDF no dispositivo; upload do arquivo para R2 |
| Busca geográfica | String match PostgreSQL | `WHERE city = $1 AND state = $2`; sem PostGIS na v1 |

### Buckets R2

| Bucket | Conteúdo | Acesso |
|---|---|---|
| `obras` | Fotos antes/depois de obras | URL pública |
| `avatares` | Fotos de perfil dos usuários | URL pública |
| `orcamentos` | PDFs gerados pelo react-pdf | URL pública (link direto ao arquivo) |
| `relatorios` | Anexos de denúncias | Privado (presigned URL) |

> O banco de dados armazena **apenas a URL pública ou o path** do arquivo. Nunca o binário.

---

## 15. Schema do Banco de Dados (Supabase)

Todas as tabelas utilizam `uuid` como PK. O `id` de `profiles` referencia `auth.users.id` e serve como chave estrangeira em todas as demais tabelas. RLS (Row Level Security) deve ser habilitado em todas as tabelas.

### Tabela: `profiles`
Estende os dados do `auth.users` do Supabase.

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | `uuid` | PK · `references auth.users` |
| `full_name` | `text` | Mín. 3 chars |
| `document_number` | `text` | CPF ou CNPJ (sem máscara) |
| `user_type` | `text[]` | Array: `['cliente', 'profissional']` |
| `bio` | `text` | Descrição do perfil |
| `avatar_url` | `text` | URL pública no R2 |
| `whatsapp` | `text` | Número com DDI |
| `social_links` | `jsonb` | `{ instagram: "@handle", facebook: "@handle" }` |
| `created_at` | `timestamptz` | Default `now()` |

---

### Tabela: `coverage_areas` *(somente Profissionais)*
Substitui lógica geográfica complexa por listas de texto simples.

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | `uuid` | PK |
| `professional_id` | `uuid` | FK → `profiles.id` |
| `nationwide` | `boolean` | Default `false`; quando `true`, ignora demais linhas |
| `state` | `text` | Sigla UF (ex: `'PB'`) |
| `city` | `text` | Nome da cidade ou `'TODAS'` para estado inteiro |

> Uma linha com `city = 'TODAS'` equivale ao "Todo o estado" da UI.

---

### Tabela: `works` *(Obras)*

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | `uuid` | PK |
| `client_id` | `uuid` | FK → `profiles.id` |
| `title` | `text` | — |
| `description` | `text` | — |
| `status` | `text` | Enum: `'aberta'`, `'em_andamento'`, `'concluida'` |
| `city` | `text` | Usado no filtro de busca |
| `state` | `text` | Usado no filtro de busca |
| `media_urls` | `text[]` | URLs públicas no bucket `obras` (máx. 5) |
| `created_at` | `timestamptz` | Default `now()` |

---

### Tabela: `proposals` *(Propostas)*

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | `uuid` | PK |
| `work_id` | `uuid` | FK → `works.id` |
| `professional_id` | `uuid` | FK → `profiles.id` |
| `status` | `text` | `'pendente'`, `'aceita'`, `'recusada'` |
| `budget_id` | `uuid` | FK → `budgets.id` (nullable) |
| `created_at` | `timestamptz` | Default `now()` |

---

### Tabela: `budgets` *(Orçamentos)*

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | `uuid` | PK |
| `professional_id` | `uuid` | FK → `profiles.id` |
| `client_name_manual` | `text` | Nome do cliente digitado manualmente |
| `valid_until` | `date` | Data de validade |
| `items` | `jsonb` | Array de itens: `[{ description, qty, unit, unit_price, discount_applicable }]` |
| `discount` | `numeric` | Desconto total aplicado |
| `total_value` | `numeric` | Calculado; persistido para consistência |
| `pdf_url` | `text` | URL do PDF no bucket `orcamentos` (R2) |
| `created_at` | `timestamptz` | Default `now()` |

---

### Tabela: `reports` *(Denúncias)*

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | `uuid` | PK |
| `reporter_id` | `uuid` | FK → `profiles.id` |
| `target_type` | `text` | `'user'`, `'work'`, `'proposal'`, `'budget'`, `'content'` |
| `target_id` | `uuid` | ID do alvo (referência polimórfica) |
| `reason` | `text` | Categoria selecionada |
| `description` | `text` | Texto livre (obrigatório quando `reason = 'other'`) |
| `attachment_urls` | `text[]` | URLs presigned no bucket `relatorios` |
| `allow_contact` | `boolean` | Consentimento de contato pelo suporte |
| `created_at` | `timestamptz` | Default `now()` |

---

## 16. Requisitos Não-Funcionais

### 16.1 Segurança

| Requisito | Detalhe |
|---|---|
| Armazenamento de token | Keychain (iOS) / SecureStore (Android) para `access_token` e `refresh_token` do Supabase |
| Padrão de auth | Supabase Auth com provider Google (OAuth 2.0 / OpenID Connect) |
| Renovação de sessão | Refresh token automático via Supabase SDK; revogação no logout |
| RLS | Row Level Security habilitado em todas as tabelas; políticas baseadas em `auth.uid()` |
| Consentimento | Registrar versão dos Termos aceitos + timestamp na tabela `profiles` |
| Dados sensíveis | Mascarar exibição quando aplicável; minimizar campos obrigatórios |

### 16.2 Acessibilidade

- Áreas de toque mínimas de 44×44pt.
- Labels e roles para leitores de tela (VoiceOver/TalkBack).
- Contraste de texto conforme WCAG AA.
- Estados de foco e erro visualmente distintos.

### 16.3 Performance

- Listas longas (cidades, obras, orçamentos): virtualização / lazy loading.
- Paginação em todas as listagens com scroll infinito ou "carregar mais".
- Imagens com lazy load e cache local.

### 16.4 Tratamento de Erros Global

| Tipo | Mensagem padrão |
|---|---|
| Sem conexão | `"Falha de conexão. Verifique sua internet e tente novamente."` |
| Erro 5xx | `"Serviço indisponível no momento. Tente novamente mais tarde."` |
| Erro 4xx | Mensagens específicas por endpoint (ver cada módulo) |

### 16.5 Telemetria (mínimo)

Eventos: `app_opened`, `splash_completed`, `login_success`, `signup_success`, `profile_saved`, `work_created`, `proposal_sent`, `proposal_accepted`, `budget_generated`, `report_submitted`, `error_{screen}_{action}`.

### 16.6 Internacionalização

- Todos os textos de UI prontos para extração em arquivos i18n.
- Locale inicial: pt-BR.

---

## 17. Integrações Back-end

Todas as operações de dados utilizam o **Supabase JS/Dart SDK** diretamente do cliente, com RLS garantindo isolamento por usuário. Edge Functions Supabase são usadas para operações que exigem lógica server-side (ex.: rate limit de denúncias, geração de presigned URL para R2).

### Auth (Supabase)
| Operação | SDK call |
|---|---|
| Login com Google | `supabase.auth.signInWithOAuth({ provider: 'google' })` |
| Logout | `supabase.auth.signOut()` |
| Sessão atual | `supabase.auth.getSession()` |

### Perfil / `profiles`
| Operação | Descrição |
|---|---|
| Leitura | `SELECT` com `id = auth.uid()` ou id público |
| Criação | `INSERT` após signup (trigger ou app) |
| Atualização | `UPDATE` com `id = auth.uid()` |

### Cobertura / `coverage_areas`
| Operação | Descrição |
|---|---|
| Leitura | `SELECT WHERE professional_id = ?` |
| Substituição | `DELETE` + `INSERT` em batch |

### Obras / `works`
| Operação | Descrição |
|---|---|
| Listagem | `SELECT` com filtros `city`, `state`, `status` |
| Detalhe | `SELECT WHERE id = ?` |
| Criação | `INSERT` com `client_id = auth.uid()` |
| Atualização | `UPDATE WHERE id = ? AND client_id = auth.uid()` |

### Propostas / `proposals`
| Operação | Descrição |
|---|---|
| Enviar proposta | `INSERT` com `professional_id = auth.uid()` |
| Aceitar/Recusar | `UPDATE status WHERE id = ? AND work.client_id = auth.uid()` |
| Vincular orçamento | `UPDATE budget_id WHERE id = ?` |

### Orçamentos / `budgets`
| Operação | Descrição |
|---|---|
| Listagem | `SELECT WHERE professional_id = auth.uid()` |
| Criar/Editar | `INSERT / UPDATE` |
| Salvar PDF | Upload para R2 → `UPDATE pdf_url` |

### Storage (Cloudflare R2)
| Bucket | Operação | Via |
|---|---|---|
| `obras` | Upload de fotos | Presigned URL (Edge Function) |
| `avatares` | Upload de avatar | Presigned URL (Edge Function) |
| `orcamentos` | Upload de PDF gerado | Presigned URL (Edge Function) |
| `relatorios` | Upload de anexos de denúncia | Presigned URL (Edge Function) |

### Denúncias / `reports`
| Operação | Descrição |
|---|---|
| Criar denúncia | `INSERT` via Edge Function (aplica rate limit 3/10min por `reporter_id`) |

### Loja
| Operação | Descrição |
|---|---|
| Listagem | Tabela `stores`; `SELECT WHERE city = ?` |

**Autenticação das chamadas:** Bearer token JWT emitido pelo Supabase Auth, enviado automaticamente pelo SDK.
**Padrão de erros Supabase:** `{ error: { message, code, details, hint } }`.

---

## 18. Critérios de Pronto (DoD)

- [ ] Fluxos encadeados executáveis: auth → onboarding → Home → módulos.
- [ ] Visibilidades por papel (Cliente / Profissional) e titularidade (dono / não dono) corretas.
- [ ] Edição de obra bloqueada com proposta aceita; aviso e invalidação com propostas pendentes.
- [ ] Tela de Denúncia funcional em todos os pontos de entrada com contexto pré-preenchido.
- [ ] Estados de loading e erro padronizados em todas as telas.
- [ ] Tokens Supabase persistidos de forma segura; "Lembrar-me" funcional.
- [ ] Deep links com fallback web funcionais.
- [ ] Telemetria básica instrumentada.
- [ ] Textos revisados e estruturados para i18n.
- [ ] Listas com virtualização/paginação.
- [ ] Geração de PDF via `react-pdf` consistente com visualização na tela; arquivo salvo no R2.
- [ ] Anti-spam de denúncias ativo (rate limit na Edge Function).
- [ ] RLS habilitado e testado em todas as tabelas Supabase.
- [ ] Buckets R2 configurados com políticas de acesso corretas (público vs. privado).
- [ ] Busca de obras/profissionais por Cidade + Estado validada com dados reais.

---

## 19. Fora do Escopo (v1)

- Pagamento in-app (fluxo atual usa link externo).
- Assinatura digital de contrato no app.
- Chat / mensageria entre usuários.
- Sistema de avaliações e reviews detalhados.
- Painel administrativo web para moderação.
- Notificações push avançadas (segmentação, campanhas).
- Suporte a múltiplos idiomas além de pt-BR.
- Integração com CEP / busca automática de endereço.

---

*Documento mantido pelo time de produto. Alterações devem ser versionadas e aprovadas pelo Product Owner antes de entrada em sprint.*
