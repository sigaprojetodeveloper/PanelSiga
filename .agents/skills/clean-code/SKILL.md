---
name: clean-code
description: >-
  Princípios e padrões de Clean Code no SigaPanelAdmin: responsabilidade única (SRP), controle de complexidade ciclomática (ESLint complexity <= 15), convenções de nomenclatura, tipagem estrita no TypeScript, funções puras e tratamento resiliente de erros.
---

# 🧹 Diretrizes de Clean Code (SigaPanelAdmin)

Este documento estabelece as diretrizes de **código limpo, legibilidade, manutenibilidade e refatoração contínua** para o **SigaPanelAdmin** em TypeScript, React 19 e Next.js 15.

---

## 1. Princípio da Responsabilidade Única (SRP - Single Responsibility)

Cada artefato no projeto deve possuir um propósito bem definido e uma única razão para mudar:

| Camada | Responsabilidade Única | O que NÃO deve conter |
| :--- | :--- | :--- |
| **Componente de Aba (`tabs/*.tsx`)** | Renderizar a estrutura visual, cartões e tabela do domínio, orquestrando filtros de tela. | Chamadas diretas a APIs externas ou queries brutas de banco (`supabase.from`). |
| **Componente de Modal (`modals/*.tsx`)** | Exibir detalhes, confirmações ou formulários em overlay com foco na tarefa atual. | Orquestração global de rotas ou manipulação de outras abas não relacionadas. |
| **Custom Hook (`hooks/*.ts`)** | Gerenciar o ciclo de vida reativo dos dados, estados de loading/erro, filtros e eventos Realtime. | Retorno de JSX ou estilização CSS. |
| **Serviço de Dados (`services/*.ts`)** | Executar a comunicação direta com o banco/storage, normalizando o payload de resposta. | Estados React (`useState`), toasts ou dependência do DOM. |
| **Utilitários (`utils.ts`)** | Funções puras e sem efeitos colaterais (cálculo de datas, formatação de moeda, máscaras). | Regras de autenticação ou chamadas assíncronas de rede. |

---

## 2. Controle de Complexidade Ciclomática (ESLint `complexity`)

O projeto possui a regra de ESLint `complexity` configurada com teto de **15** caminhos lógicos por função:

### 2.1 Como Reduzir a Complexidade
1. **Guard Clauses / Retornos Precoces (Early Return):**
   ```typescript
   // ❌ Evitar aninhamento excessivo
   function processItem(item: Item | null) {
     if (item) {
       if (item.status === 'active') {
         // Lógica profunda...
       }
     }
   }

   // ✅ Preferir retorno rápido
   function processItem(item: Item | null) {
     if (!item || item.status !== 'active') return;
     // Lógica principal linear...
   }
   ```
2. **Extração de Subcomponentes ou Helpers:**
   Se uma renderização de tabela possui múltiplos `switch/case` e condicionais ternárias para badges, extraia para uma função ou componente utilitário (ex: `getStatusBadge(status)` ou `formatScope(item)`).
3. **Mapeamento por Objetos (Lookup Tables) em vez de `if/else` encadeados:**
   ```typescript
   // ✅ Limpo e O(1)
   const STATUS_MAP: Record<string, { label: string; className: string }> = {
     pending: { label: 'Pendente', className: 'badge-warning' },
     active: { label: 'Ativo', className: 'badge-success' },
     rejected: { label: 'Recusado', className: 'badge-danger' },
   };
   ```
4. **Diretiva de Complexidade:**
   Caso um componente de visualização gráfica ou modal possua complexidade naturalmente superior devido a árvores ricas de JSX ou múltiplos filtros de visualização, utilize a diretiva explícita no topo do arquivo em vez de desabilitar globalmente:
   ```typescript
   /* eslint-disable complexity */
   ```

---

## 3. Padrões de Nomenclatura (Naming Conventions)

Nomes de arquivos, funções e variáveis devem ser autoexplicativos e previsíveis:

* **Arquivos e Componentes React:** `PascalCase` (ex: `ModerationRejectionsTab.tsx`, `RejectionDetailModal.tsx`).
* **Custom Hooks:** `camelCase` iniciado por `use` (ex: `useModerationRejections.ts`, `useWorksModeration.ts`).
* **Serviços:** `camelCase` terminado em `Service` (ex: `moderationService.ts`, `notificationsService.ts`).
* **Manipuladores de Eventos (Handlers):**
  * Prefixo `handle` na função que executa a ação (ex: `handleOpenDetail`, `handleRejectItem`).
  * Prefixo `on` na prop que recebe o callback (ex: `onClose`, `onSuccess`).
* **Variáveis Booleanas:** Prefixadas por verbos de estado (ex: `isOpen`, `isLoading`, `hasPendingStories`, `canDelete`).
* **Coleções e Listas:** Plural explicativo (ex: `rejectedItems`, `filteredUsers`, `pendingStories`).

---

## 4. Tipagem Estrita e Descarte do `any`

O projeto aproveita o TypeScript para blindar a integridade dos dados:

```typescript
// ❌ Evitar tipagem frouxa
const handleSave = (data: any) => { ... };

// ✅ Tipagem precisa baseada no contrato do Supabase
import type { Database } from '../types/database.types';

type BannerRow = Database['public']['Tables']['banners']['Row'];
type StoryRow = Database['public']['Tables']['story_items']['Row'];

interface RejectionParams {
  id: string;
  type: 'banner' | 'story';
  reason: string;
}
```

* **Uniões Discriminadas:** Ao lidar com múltiplos tipos na mesma listagem (ex: Banners e Stories), utilize um campo discriminador explícito:
  ```typescript
  export interface RejectedItem {
    id: string;
    _type: 'banner' | 'story';
    title?: string | null;
    ...
  }
  ```

---

## 5. Tratamento Resiliente de Erros e Feedback Visual

Qualquer operação assíncrona deve ser previsível tanto no código quanto na experiência do usuário:

```typescript
const executeAction = async () => {
  setActionLoading(true);
  try {
    await someService.performOperation(params);
    success('Operação executada com sucesso!');
    await refetch();
  } catch (err: any) {
    console.error('[domainName] Falha ao executar operação:', err);
    error(err.message || 'Não foi possível completar a ação.');
  } finally {
    setActionLoading(false);
  }
};
```

1. **Sempre use `finally`:** Garanta que estados de `loading` ou bloqueio de botões sejam liberados mesmo se uma exceção for disparada.
2. **Logs Estruturados no Console:** Use prefixos identificando o arquivo e método: `console.error('[moderationService] Erro ao recusar item:', error)`.
3. **Feedback Imediato (Toast):** Nunca silencie erros em operações administrativas; informe o operador através do `useToast()`.

---

## 6. Imutabilidade e Manipulação de Estado no React 19

* **Nunca mutar arrays ou objetos diretamente:**
  ```typescript
  // ❌ Incorreto
  items.push(newItem);
  setItems(items);

  // ✅ Correto (Spread / Imutabilidade)
  setItems(prev => [newItem, ...prev]);
  ```
* **Cálculos Derivados com `useMemo`:** Evite duplicar estado no `useState` para dados que podem ser calculados diretamente a partir da lista original (ex: contagem de itens, estatísticas e listas filtradas).
