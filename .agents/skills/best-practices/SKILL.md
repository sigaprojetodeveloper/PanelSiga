---
name: best-practices
description: >-
  Boas práticas de engenharia no SigaPanelAdmin: ciclo de vida do React 19, Supabase Realtime sem memory leak, alternância segura de ambientes dev/prod, otimização de consultas PostgreSQL, controle de RBAC e validação obrigatória de build.
---

# 🌟 Boas Práticas de Engenharia (SigaPanelAdmin)

Este documento reúne as **boas práticas essenciais** para o desenvolvimento contínuo, manutenção e evolução segura do painel administrativo **SigaPanelAdmin**.

---

## 1. Supabase Realtime & Prevenção de Memory Leaks

O painel utiliza canais em tempo real para refletir novas solicitações de anúncios, denúncias e alterações de status instantaneamente.

### 1.1 Fechamento Obrigatório de Canais (Cleanup)
Toda inscrição em `supabase.channel(...)` **deve** ser desfeita na função de limpeza do `useEffect`:

```typescript
useEffect(() => {
  const channel = supabase
    .channel('meu_canal_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'banners' },
      (payload) => {
        handleRealtimeUpdate(payload);
      }
    )
    .subscribe();

  // ✅ CRÍTICO: Limpeza de canal ao desmontar componente ou recriar hook
  return () => {
    supabase.removeChannel(channel);
  };
}, [/* dependências estáveis */]);
```

### 1.2 Padrão de Referência (`useRef`) para Evitar Stale Closures
Ao utilizar callbacks ou estados que mudam frequentemente dentro do listener Realtime sem querer reiniciar o canal a cada render:
```typescript
const filterRef = useRef(currentFilter);
useEffect(() => {
  filterRef.current = currentFilter;
}, [currentFilter]);

useEffect(() => {
  const channel = supabase.channel('...').on('postgres_changes', ..., () => {
    // Usa filterRef.current com o valor mais recente sem re-inscrever o canal
    fetchData(filterRef.current);
  }).subscribe();
  return () => { supabase.removeChannel(channel); };
}, []);
```

---

## 2. Isolamento de Ambientes (Desenvolvimento vs Produção)

O **SigaPanelAdmin** opera sobre duas instâncias distintas do Supabase (Dev e Prod).

### 2.1 Regras de Ouro
1. **Nunca modifique `.env.local` manualmente:** Utilize sempre os scripts oficiais do projeto:
   * `npm run env:dev`: Muda para a base de Desenvolvimento.
   * `npm run env:prod`: Muda para a base de Produção.
   * `npm run env:status`: Imprime no terminal qual ambiente está apontado no momento.
2. **Nunca comite credenciais:** Arquivos `.env.local`, `.env.development` e `.env.production` com chaves sensíveis estão no `.gitignore`.
3. **Cuidado redobrado com comandos de escrita:** Sempre confira o ambiente ativo com `npm run env:status` antes de executar ações de teste, migrações ou scripts de carga.

---

## 3. Otimização de Consultas & Boas Práticas de Banco

Ao criar novas rotas ou serviços que consomem o Supabase:

1. **Evite `select('*')` irrestrito em tabelas volumosas:**
   * Sempre limite (`.limit(...)`), pagine com offset (`.range(...)`) ou filtre por datas/status.
2. **Projeções de Relações (Foreign Keys):**
   * Selecione apenas as colunas necessárias das tabelas relacionadas:
     ```typescript
     // ✅ Otimizado e seguro
     supabase
       .from('banners')
       .select('id, title, image_url, created_at, users(name, email, phone)')
       .eq('status', 'rejected')
     ```
3. **Índices de Ordenação:**
   * Garanta que campos frequentemente utilizados em cláusulas `order('created_at', { ascending: false })` possuam índices adequados no PostgreSQL.
4. **Soft Deletes:**
   * Registros críticos (banners, stories, usuários, empresas) utilizam deleção lógica (`status: 'deleted'`) para preservação de histórico financeiro e trilha de auditoria. Evite `DELETE FROM` direto.

---

## 4. Segurança Administrativa & RBAC

1. **Separação de Papéis (`admin` vs `admin_master`):**
   * Funções estratégicas (criação de outros administradores, configuração de preços em `ad_pricing`, descontos municipais) **devem** ser bloqueadas na UI e no backend para operadores comuns (`admin`).
2. **Prevenção de Autoexclusão:**
   * Um administrador logado não pode excluir ou suspender seu próprio usuário.
3. **Auditoria de Ações Críticas:**
   * Toda recusa, bloqueio de obra ou alteração de selo deve registrar o motivo (`rejection_reason` ou `notes`) e associar ao operador responsável.

---

## 5. Checklist Obrigatório de Build & Validação

Antes de concluir qualquer tarefa ou enviar alterações para commit:

1. **Executar compilação completa:**
   ```bash
   npm run build
   ```
2. **O que verificar:**
   * `Linting and checking validity of types`: Deve passar com **0 erros de TypeScript** e conformidade com o ESLint.
   * `Generating static pages`: As páginas estáticas e dinâmicas do Next.js devem ser compiladas sem exceções de build.
3. **Erros Comuns de Build:**
   * Imports não utilizados ou caminhos relativos quebrados.
   * Tipagem incompatível em interfaces de props ou hooks.
   * Complexidade ciclomática estourando o limite de 15 sem diretiva local (`/* eslint-disable complexity */`).
