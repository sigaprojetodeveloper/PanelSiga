# Especificação Técnica: Painel Admin - Configurações de Preços, Descontos e Monetização
**Módulo:** Divulgação de Lojas (Sprint 15)  
**Arquivo:** `03_admin_settings_tab.md`

---

## 1. Visão Geral da Interface

A aba **Configurações de Preços e Monetização** permite que a equipe administrativa gerencie a tabela de tarifas e precificação dinâmica cobrada dos lojistas para anúncio na plataforma. Ela dá suporte a valores diferenciados por região (ex: capitais x cidades menores), define o custo de filiais extras em uma mesma localidade e permite configurar **descontos por cadastramento de endereços em cidades distintas**.

### Layout da Interface

```
+----------------------------------------------------------------------------------------------------+
| PAINEL ADMINISTRATIVO > CONFIGURAÇÕES DE MONETIZAÇÃO                                               |
+----------------------------------------------------------------------------------------------------+
| 🌐 FALLBACK GLOBAL NACIONAL (Regra Padrão para cidades sem tarifa customizada)                      |
| Base Lite: R$ 99,00 /ano | Base Premium: R$ 199,00 /ano                                             |
| Extra Lite: R$ 29,00 /ano | Extra Premium: R$ 49,00 /ano                            [ ✏️ Editar ]      |
+----------------------------------------------------------------------------------------------------+
| 🏙️ TARIFAS CUSTOMIZADAS REGIONAIS                      [ 🔍 Buscar Cidade... ]  [ + Nova Exceção ] |
+----------------------------------------------------------------------------------------------------+
| Cidade           | Estado | Base Lite | Base Premium | Extra Lite | Extra Premium | Ações        |
|------------------|--------|-----------|--------------|------------|---------------|--------------|
| São Paulo        | SP     | R$ 150,00 | R$ 290,00    | R$ 30,00   | R$ 60,00      | [ ✏️ ] [ 🗑️ ]  |
| Rio de Janeiro   | RJ     | R$ 140,00 | R$ 270,00    | R$ 30,00   | R$ 50,00      | [ ✏️ ] [ 🗑️ ]  |
| Belo Horizonte   | MG     | R$ 120,00 | R$ 220,00    | R$ 25,00   | R$ 45,00      | [ ✏️ ] [ 🗑️ ]  |
+----------------------------------------------------------------------------------------------------+
| 🏷️ DESCONTOS POR CIDADES DISTINTAS                                       [ + Novo Desconto ]       |
+----------------------------------------------------------------------------------------------------+
| Qtd. Mínima de Cidades Distintas | Desconto (%) | Status    | Ações                                   |
|-----------------------------------|--------------|-----------|-----------------------------------------|
| A partir de 2 Cidades             | 10,00% OFF   | Ativo     | [ ✏️ ] [ 🗑️ ]                            |
| A partir de 3 Cidades             | 15,00% OFF   | Ativo     | [ ✏️ ] [ 🗑️ ]                            |
| A partir de 5 Cidades             | 20,00% OFF   | Ativo     | [ ✏️ ] [ 🗑️ ]                            |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Componentes e Estrutura da Tela

### 2.1 Bloco de Fallback Global Nacional (Preço Padrão)
* Representa o registro da tabela `city_pricings` onde `is_default = true` (`city_name = 'DEFAULT'` e `state = 'ALL'`).
* Exibido em um Card de destaque no topo da tela.
* Garante que caso um lojista cadastre um estabelecimento em qualquer cidade do país que ainda não possua uma tarifa customizada, a precificação funcione de forma automatizada sem erros de cobrança.

---

### 2.2 Tabela de Exceções Regionais
Exibe todas as tarifas específicas onde `is_default = false` (`city_name != 'DEFAULT'`).

#### Colunas da Tabela

| Coluna | Campo Banco | Formatação Visual |
| :--- | :--- | :--- |
| **Cidade** | `city_pricings.city_name` | Nome da cidade em negrito (ex: `"São Paulo"`) |
| **Estado** | `city_pricings.state` | Badge de sigla de 2 letras (ex: `"SP"`) |
| **Base Lite** | `city_pricings.price_lite` | Convertido de centavos para R$ (ex: `15000` -> `R$ 150,00`) |
| **Base Premium** | `city_pricings.price_premium` | Convertido de centavos para R$ (ex: `29000` -> `R$ 290,00`) |
| **Extra Lite** | `city_pricings.tax_extra_lite` | Adicional por endereço extra em R$ (ex: `R$ 30,00`) |
| **Extra Premium** | `city_pricings.tax_extra_premium` | Adicional por endereço extra em R$ (ex: `R$ 60,00`) |
| **Ações** | N/A | Botões de **Editar** `[✏️]` e **Excluir** `[🗑️]` |

---

### 2.3 Seção de Descontos por Cidades Distintas (`city_volume_discounts`)
Permite definir patamares flexíveis de desconto progressivo para lojistas que cadastrarem endereços em múltiplos municípios.

#### Colunas da Tabela de Descontos

| Coluna | Campo Banco | Formatação Visual |
| :--- | :--- | :--- |
| **Cidades Distintas** | `min_distinct_cities` | Texto explicativo (ex: `"A partir de 2 Cidades"`) |
| **Desconto (%)** | `discount_percentage` | Formatado com 2 casas decimais e `% OFF` (ex: `10,00% OFF`) |
| **Status** | `is_active` | Badge semântica: `Ativo` (Verde) / `Inativo` (Cinza) |
| **Ações** | N/A | Botões de **Editar** `[✏️]` e **Excluir** `[🗑️]` |

---

## 3. Modais de Configuração

### 3.1 Modal de Cadastro / Edição de Preço (Regional ou Padrão)

Ao clicar no botão `[ + Nova Exceção ]` ou `[ ✏️ Editar ]`:

```
+--------------------------------------------------------------------+
| MODAL: FORMULÁRIO DE CADASTRO / EDIÇÃO DE PREÇO                    |
+--------------------------------------------------------------------+
| [☑] Preço Padrão (Desativa Cidade e Estado)                        |
|                                                                    |
| Estado (UF)*: [ SP ▾ ]   (Desativado se Preço Padrão marcado)       |
| Cidade*: [ São Paulo  ]  (Desativado se Preço Padrão marcado)       |
|                                                                    |
| --- VALORES DO PLANO LITE (Anual) ---                              |
| Preço Base Lite*: [ R$ 150,00 ]    Taxa Endereço Extra*: [ R$ 30,00 ]|
|                                                                    |
| --- VALORES DO PLANO PREMIUM (Anual) ---                           |
| Preço Base Premium*: [ R$ 290,00 ] Taxa Endereço Extra*: [ R$ 60,00 ]|
|                                                                    |
| [ Cancelar ]                                    [ Salvar Regra ]   |
+--------------------------------------------------------------------+
```

#### Validações e Regras de Negócio do Checkbox "Preço Padrão":
1. **Comportamento do Checkbox `is_default`:**
   * **Quando MARCADO (`is_default = true`):**
     * Desativa os campos de Estado (UF) e Cidade (`disabled = true`).
     * Limpa os valores visuais dos campos e assume internamente `state = 'ALL'` e `city_name = 'DEFAULT'`.
   * **Quando DESMARCADO (`is_default = false`):**
     * Reativa os campos de Estado (UF) e Cidade.
     * Torna **OBRIGATÓRIO** o preenchimento dos campos Cidade e Estado. O formulário deve bloquear a submissão se algum estiver em branco.
2. **Campos Monetários:** Mascara `R$ 0,00` e converte para **centavos** (`val * 100`) no envio ao Supabase.
3. **Duplicidade de Localidade:** A combinação de `(city_name, state)` possui constraint `UNIQUE`.

---

### 3.2 Modal de Cadastro / Edição de Regra de Desconto

Ao clicar em `[ + Novo Desconto ]` ou `[ ✏️ Editar ]` na seção de descontos:

```
+--------------------------------------------------------------------+
| MODAL: REGRA DE DESCONTO POR CIDADES DISTINTAS                     |
+--------------------------------------------------------------------+
| Qtd. Mínima de Cidades Distintas*: [ 2 ]                           |
| Percentual de Desconto (%)*: [ 10.00 ] %                           |
| Status: [☑] Ativo                                                  |
|                                                                    |
| [ Cancelar ]                                    [ Salvar Desconto ]|
+--------------------------------------------------------------------+
```

#### Validações:
* `min_distinct_cities` deve ser um inteiro maior ou igual a 2.
* `discount_percentage` deve ser maior que 0 e menor ou igual a 100.

---

## 4. Engine de Resolução e Algoritmo de Cálculo de Orçamento

Esta seção documenta a lógica executada pela **Edge Function** ou Backend ao calcular o valor total de uma assinatura antes de gerar o *Stripe PaymentIntent*.

### 4.1 Resolução Hierárquica de Tarifas (Fallback Rules)

Dado um endereço cadastrado na cidade `C` e estado `E`:
1. Busca em `city_pricings` onde `LOWER(city_name) = LOWER(C)` AND `LOWER(state) = LOWER(E)` AND `is_default = false`.
2. Se a busca retornar resultado, utiliza as tarifas encontradas.
3. Se **não encontrar**, busca em `city_pricings` a regra padrão `is_default = true` (`city_name = 'DEFAULT'` AND `state = 'ALL'`).

---

### 4.2 Algoritmo de Precificação com Desconto por Cidades Distintas

Uma loja pode conter $N$ endereços/filiais cadastrados. A cobrança é calculada em 3 etapas:

1. **Agrupamento por Cidade e Cálculo do Subtotal Bruto por Cidade:**
   $$Subtotal(cidade) = PrecoBase(cidade, tier) + (N_{enderecos\_na\_cidade} - 1) \times TaxaExtra(cidade, tier)$$

2. **Soma do Valor Bruto Total:**
   $$ValorBrutoTotal = \sum_{cidade \in Cidades} Subtotal(cidade)$$

3. **Aplicação do Desconto por Cidades Distintas:**
   * Conta a quantidade $K$ de cidades distintas entre todos os endereços da loja ($K = |Cidades|$).
   * Busca na tabela `city_volume_discounts` o maior patamar ativo com `min_distinct_cities <= K`.
   * Se houver um patamar aplicável com percentual $D\%$:
     $$ValorDesconto = ValorBrutoTotal \times \frac{D}{100}$$
     $$ValorFinalPago = ValorBrutoTotal - ValorDesconto$$
   * Se não houver patamar ($K < \text{mínimo configurado}$), $ValorFinalPago = ValorBrutoTotal$.

---

#### Cenário de Exemplo Prático (Múltiplas Cidades com Desconto):
* **Loja:** Plano `PREMIUM`
* **Localização (3 filiais em 2 cidades distintas):**
  * 2 filiais em São Paulo / SP
  * 1 filial no Rio de Janeiro / RJ
* **Regras de Preço:**
  * **SP:** Base Premium = R$ 290,00 | Extra Premium = R$ 60,00
  * **RJ:** Base Premium = R$ 270,00 | Extra Premium = R$ 50,00
* **Tabela de Descontos:** $\ge 2$ cidades distintas = 10% OFF
* **Cálculo:**
  * Subtotal SP (2 filiais): $R\$ 290,00 + (1 \times R\$ 60,00) = R\$ 350,00$
  * Subtotal RJ (1 filial): $R\$ 270,00 + (0 \times R\$ 50,00) = R\$ 270,00$
  * **Valor Bruto Total:** $R\$ 350,00 + R\$ 270,00 = R\$ 620,00$
  * **Cidades Distintas:** 2 cidades (Aciona o patamar de 10% OFF)
  * **Desconto Concedido (10%):** $R\$ 620,00 \times 0.10 = R\$ 62,00$
  * **Valor Final Pago:** $R\$ 620,00 - R\$ 62,00 = \mathbf{R\$ 558,00}\ (55800\text{ centavos})$

---

## 5. Implementação Técnica (Queries Supabase SDK)

### 5.1 Busca e Atualização de Tarifas e Descontos (Admin Web)

```typescript
// Buscar lista completa de tarifas regionais + Fallback Padrão + Regras de Desconto
export async function getMonetizationSettings() {
  const { data: pricings, error: errPricings } = await supabase
    .from('city_pricings')
    .select('*')
    .order('city_name', { ascending: true });

  if (errPricings) throw errPricings;

  const { data: discounts, error: errDiscounts } = await supabase
    .from('city_volume_discounts')
    .select('*')
    .order('min_distinct_cities', { ascending: true });

  if (errDiscounts) throw errDiscounts;

  const fallbackRule = pricings.find(p => p.is_default || p.city_name === 'DEFAULT');
  const regionalRules = pricings.filter(p => !p.is_default && p.city_name !== 'DEFAULT');

  return { fallbackRule, regionalRules, discounts };
}

// Salvar ou Atualizar Exceção Regional ou Preço Padrão
export async function upsertCityPricing(pricingData: {
  id?: string;
  is_default: boolean;
  city_name: string;
  state: string;
  price_lite: number;      // Em centavos
  price_premium: number;   // Em centavos
  tax_extra_lite: number;  // Em centavos
  tax_extra_premium: number; // Em centavos
}) {
  const isDefault = pricingData.is_default;
  
  const payload = {
    ...(pricingData.id ? { id: pricingData.id } : {}),
    is_default: isDefault,
    city_name: isDefault ? 'DEFAULT' : pricingData.city_name.trim(),
    state: isDefault ? 'ALL' : pricingData.state.trim().toUpperCase(),
    price_lite: pricingData.price_lite,
    price_premium: pricingData.price_premium,
    tax_extra_lite: pricingData.tax_extra_lite,
    tax_extra_premium: pricingData.tax_extra_premium,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('city_pricings')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Upsert de Regra de Desconto por Cidades Distintas
export async function upsertVolumeDiscount(discountData: {
  id?: string;
  min_distinct_cities: number;
  discount_percentage: number;
  is_active: boolean;
}) {
  const { data, error } = await supabase
    .from('city_volume_discounts')
    .upsert({
      ...(discountData.id ? { id: discountData.id } : {}),
      min_distinct_cities: discountData.min_distinct_cities,
      discount_percentage: discountData.discount_percentage,
      is_active: discountData.is_active,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### 5.2 Função de Cálculo Server-Side (Edge Function)

```typescript
// Resolução de preços e aplicação de desconto por cidades distintas
export async function calculateEnterpriseCheckoutPrice(enterpriseId: string) {
  // 1. Buscar empresa e filiais
  const { data: enterprise } = await supabase.from('enterprises').select('tier').eq('id', enterpriseId).single();
  const { data: addresses } = await supabase.from('enterprise_addresses').select('city, state').eq('enterprise_id', enterpriseId);

  if (!addresses || addresses.length === 0) throw new Error('O estabelecimento não possui endereços.');

  // 2. Agrupar por cidade
  const cityGroups = new Map<string, { city: string; state: string; count: number }>();
  for (const addr of addresses) {
    const key = `${addr.city.toLowerCase()}_${addr.state.toLowerCase()}`;
    if (!cityGroups.has(key)) {
      cityGroups.set(key, { city: addr.city, state: addr.state, count: 0 });
    }
    cityGroups.get(key)!.count++;
  }

  let grossTotalCentavos = 0;
  const isPremium = enterprise.tier === 'PREMIUM';

  // 3. Obter tabela de preços
  const { data: allPricings } = await supabase.from('city_pricings').select('*');
  const defaultPricing = allPricings.find(p => p.is_default || p.city_name === 'DEFAULT');

  for (const [_, group] of cityGroups) {
    const rule = allPricings.find(
      p => !p.is_default && p.city_name.toLowerCase() === group.city.toLowerCase() && p.state.toLowerCase() === group.state.toLowerCase()
    ) || defaultPricing;

    const basePrice = isPremium ? rule.price_premium : rule.price_lite;
    const extraPrice = isPremium ? rule.tax_extra_premium : rule.tax_extra_lite;

    const citySubtotal = basePrice + (group.count - 1) * extraPrice;
    grossTotalCentavos += citySubtotal;
  }

  // 4. Verificar Desconto por Cidades Distintas
  const distinctCitiesCount = cityGroups.size;
  const { data: discounts } = await supabase
    .from('city_volume_discounts')
    .select('*')
    .eq('is_active', true)
    .lte('min_distinct_cities', distinctCitiesCount)
    .order('min_distinct_cities', { ascending: false });

  let discountPercentage = 0;
  if (discounts && discounts.length > 0) {
    discountPercentage = Number(discounts[0].discount_percentage);
  }

  const discountAmountCentavos = Math.round(grossTotalCentavos * (discountPercentage / 100));
  const finalTotalCentavos = grossTotalCentavos - discountAmountCentavos;

  return {
    grossTotalCentavos,
    discountPercentage,
    discountAmountCentavos,
    finalTotalCentavos,
    distinctCitiesCount
  };
}
```

