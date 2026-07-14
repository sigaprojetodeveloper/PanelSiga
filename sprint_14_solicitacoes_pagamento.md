# Especificação Técnica: Sprint — Solicitações e Pagamento (Web - App)

Esta especificação detalha a integração de ponta a ponta para a moderação administrativa dos anúncios (Banners e Stories) via **SigaPanelAdmin** e o fluxo simplificado de pagamento e ativação dos anúncios aceitos no aplicativo **SigaMobile**.

---

## 1. Estrutura de Banco de Dados & Modelagem

Esta sprint introduz o controle financeiro de publicações no banco de dados compartilhado (Supabase).

### 1.1 Tabela de Configurações de Preços (`public.ad_pricing_settings`)
Armazena a precificação diária por tipo de anúncio e escopo de abrangência geográfica.
```sql
CREATE TABLE IF NOT EXISTS public.ad_pricing_settings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_type        text NOT NULL CHECK (ad_type IN ('banner', 'story')),
  scope          text NOT NULL CHECK (scope IN ('global', 'national', 'state', 'city')),
  price_per_day  numeric(10,2) NOT NULL DEFAULT 0.00,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ad_type, scope)
);

-- Seed de preços padrão de exemplo
INSERT INTO public.ad_pricing_settings (ad_type, scope, price_per_day) VALUES
('banner', 'global', 150.00),
('banner', 'national', 80.00),
('banner', 'state', 35.00),
('banner', 'city', 15.00),
('story', 'global', 120.00),
('story', 'national', 60.00),
('story', 'state', 25.00),
('story', 'city', 10.00)
ON CONFLICT (ad_type, scope) DO NOTHING;
```

### 1.2 Tabela de Pagamentos de Anúncios (`public.ad_payments`)
Registra as transações financeiras associadas à ativação dos anúncios.
```sql
CREATE TABLE IF NOT EXISTS public.ad_payments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  banner_id         uuid REFERENCES public.banners(id) ON DELETE CASCADE,
  story_channel_id  uuid REFERENCES public.story_channels(id) ON DELETE CASCADE,
  amount            numeric(10,2) NOT NULL,
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  paid_at           timestamptz,
  CONSTRAINT check_only_one_ad CHECK (
    (banner_id IS NOT NULL AND story_channel_id IS NULL) OR
    (banner_id IS NULL AND story_channel_id IS NOT NULL)
  )
);
```

### 1.3 Procedimento de Ativação Automática (Procedimento / Trigger)
Assim que o status de um registro na tabela `ad_payments` for alterado para `'paid'`, o sistema deve atualizar o respectivo anúncio para `'Ativo'` ou `'Agendado'` baseando-se na data atual e de inicialização.

```sql
CREATE OR REPLACE FUNCTION public.handle_ad_payment_success()
RETURNS TRIGGER AS $$
DECLARE
  v_start_date date;
  v_new_status text;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
    -- Determina o status baseado na data de inicializacao do anuncio
    
    -- 1. Se for Banner
    IF NEW.banner_id IS NOT NULL THEN
      SELECT data_inicializacao INTO v_start_date FROM public.banners WHERE id = NEW.banner_id;
      
      IF v_start_date <= CURRENT_DATE THEN
        v_new_status := 'Ativo';
      ELSE
        v_new_status := 'Agendado';
      END IF;

      UPDATE public.banners
      SET status = v_new_status
      WHERE id = NEW.banner_id;
    END IF;

    -- 2. Se for Story Channel
    IF NEW.story_channel_id IS NOT NULL THEN
      SELECT data_inicializacao INTO v_start_date FROM public.story_channels WHERE id = NEW.story_channel_id;

      IF v_start_date <= CURRENT_DATE THEN
        v_new_status := 'Ativo';
      ELSE
        v_new_status := 'Agendado';
      END IF;

      UPDATE public.story_channels
      SET status = v_new_status
      WHERE id = NEW.story_channel_id;
    END IF;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_ad_payment_success
  AFTER UPDATE OF status ON public.ad_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_ad_payment_success();
```

---

## 2. Painel Web Administrativo (SigaPanelAdmin)

### 2.1 Tela de Solicitações (Aba de Moderação)
Uma nova aba (ex: "Solicitações de Anúncios") será criada no dashboard principal do `SigaPanelAdmin`.

*   **Filtros de Tabela**: Opção para listar por tipo (Banners / Stories) com status `'Pendente'`.
*   **Abertura de Detalhes (Visualização e Decisão)**:
    *   Ao clicar em um item da lista, abre-se um modal detalhado (leitura bloqueada para edição).
    *   **Informações Exibidas**: Nome do usuário solicitante, tipo de anúncio, imagem principal (ou avatar do canal), abrangência selecionada, vigência (datas), preço cobrado e informações textuais.
    *   Se for um canal de stories, lista também os stories que já foram enviados ou permite ver o canal limpo.
*   **Ações de Moderação**:
    1.  **Botão "Aceitar Solicitação"**:
        *   Ao clicar, atualiza o status do banner ou story_channel para `'Aguardando Pagamento'`.
        *   Gera uma notificação de sucesso para o usuário solicitante.
    2.  **Botão "Recusar Solicitação"**:
        *   Abre um sub-menu pop-up com as opções padrão de recusa configuradas em front-end:
            *   *Imagem de baixa qualidade ou inapropriada*
            *   *Texto com erros ou ofensivo*
            *   *Link inválido ou suspeito*
            *   *Outro (especificar)*
        *   A opção "Outro (especificar)" ativa uma caixa de texto livre obrigatória para o administrador justificar a recusa.
        *   Ao confirmar, atualiza o status do banner/canal para `'Recusado'`, insere o texto da justificativa na coluna `rejection_reason` e envia uma notificação informando o ocorrido e o motivo.

### 2.2 Tela de Configurações de Prazos e Preços
Integrada na aba de configurações (`settings`) do Next.js do painel administrativo.

*   **Formulários de Precificação Diária**:
    *   Duas seções paralelas: **Configurações para Banners** e **Configurações para Canais de Stories**.
    *   Campos de input monetário (`R$`) para os quatro tipos de escopo:
        *   Preço Global (Válido para exibição internacional/mundial)
        *   Preço País (Exibição a nível de Brasil)
        *   Preço Estado (Filtro por estado de residência do usuário)
        *   Preço Cidade (Filtro geolocalizado municipal)
*   **Salvar**: Ao clicar em "Atualizar Preços", envia um comando de `upsert` na tabela `ad_pricing_settings` atualizando a precificação padrão usada nos cálculos do mobile.

---

## 3. Aplicativo Móvel (SigaMobile)

### 3.1 Botão de Pagamento na Lista de Anúncios
*   Na tela **"Minhas Publicidades"**, qualquer anúncio (seja banner ou canal de story) que tenha sido aprovado pela moderação estará com a tag de status `'Aguardando Pagamento'`.
*   Nestes cards específicos, será renderizado um botão proeminente de ação rápida **"Pagar Anúncio"**. Ao tocar, o usuário é redirecionado para a tela de pagamento.

### 3.2 Tela Pagamento (`/app/publicidades/pagamento.tsx`)
A tela de checkout de anúncio apresentará as seguintes informações estruturadas de forma limpa e harmônica:

1.  **Detalhes da Publicidade**:
    *   Título / Nome do Anúncio.
    *   Tipo (Banner / Canal de Story).
    *   Abrangência geográfica e vigência total (Ex: 01/07 a 10/07 — 10 Dias).
2.  **Demonstrativo Financeiro**:
    *   Preço diário definido para a região: `R$ XX,XX / dia`.
    *   Preço total a ser cobrado: `R$ XXX,XX` (Multiplicação automática de dias x valor unitário).
3.  **Simulação de Pagamento Unificado (One-click Integration)**:
    *   De acordo com a decisão de desenvolvimento, a tela de pagamento será focada em uma simulação direta de teste rápido ("um clique").
    *   **Botão "Confirmar e Ativar Publicação"**:
        *   Ao tocar, o app executa uma transação local inserindo na tabela `ad_payments` o registro correspondente com status `'paid'`.
        *   O trigger do banco (`on_ad_payment_success`) detecta a mudança e altera automaticamente o status do banner/canal para `'Ativo'` ou `'Agendado'`.
        *   O app exibe um feedback visual premium de sucesso (ex: tela de confetes ou check animado com mensagem de sucesso).
        *   Redireciona o usuário de volta à lista "Minhas Publicidades" atualizada com o novo status.

---

## 4. Integração de Notificações

Para manter o usuário atualizado sobre suas transações, as ações no painel de moderação dispararão inserções automáticas na tabela `public.notifications` do usuário proprietário, ativando os alertas no app:

### 4.1 Notificação de Aprovado
*   **Título**: `Publicação Aprovada! 🚀`
*   **Body**: `Sua solicitação de [Banner/Canal] "[Nome]" foi aprovada. Clique aqui para realizar o pagamento e iniciar sua exibição.`
*   **Type**: `ad_approved`
*   **Related ID**: `banner_id` ou `story_channel_id`

### 4.2 Notificação de Recusado
*   **Título**: `Publicação Recusada ⚠️`
*   **Body**: `Sua solicitação de [Banner/Canal] "[Nome]" foi recusada pela moderação. Motivo: [Justificativa].`
*   **Type**: `ad_rejected`
*   **Related ID**: `banner_id` ou `story_channel_id`
