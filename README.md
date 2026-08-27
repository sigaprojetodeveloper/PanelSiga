# Siga - Painel Administrativo Web

Este é o Painel Administrativo Web para a plataforma **Siga**, desenvolvido em **React**, **TypeScript**, **Next** e estilizado com um Design System premium glassmórfico. Ele fornece recursos de controle de moderação de denúncias, gerenciamento de usuários e publicação de stories integrados diretamente ao banco de dados do **Supabase**.

---

## 🛠️ Pré-requisitos e Configuração

Antes de iniciar, certifique-se de que possui o **Node.js** instalado em sua máquina.

### Variáveis de Ambiente

O projeto suporta múltiplos ambientes gerenciados automaticamente. Você pode copiar [.env.example](file:///home/gernano/workspace/antigravity/Projeto_Siga/ProjetoGlobal/SigaPanelAdmin/.env.example) para criar novas configurações.

* `.env.development` — Aponta para o projeto Supabase de Desenvolvimento.
* `.env.production` — Aponta para o projeto Supabase de Produção.

---

## 🚀 Comandos de Execução e Modos de Operação

Na raiz do projeto (`SigaPanelAdmin`), utilize os seguintes comandos do NPM:

### 1. Servidor Local (Desenvolvimento vs Produção)

* **Iniciar em Desenvolvimento:**
  ```bash
  npm run dev
  ```
  *Garante o apontamento para Desenvolvimento e inicia o Next.js em `http://localhost:3000`.*

* **Iniciar em Produção:**
  ```bash
  npm run prod
  ```
  *Exibe alerta de segurança no terminal, garante o apontamento para Produção e inicia o Next.js.*

### 2. Gerenciamento Rápido de Ambientes

* **Chavear apenas as variáveis:**
  ```bash
  npm run env:dev     # Aponta para Desenvolvimento
  npm run env:prod    # Aponta para Produção
  npm run env:status  # Verifica qual ambiente está ativo
  ```

### 3. Compilação e Build

* **Build para Desenvolvimento:**
  ```bash
  npm run build
  ```

* **Build para Produção:**
  ```bash
  npm run build:prod
  ```

### 4. Executar Servidor Compilado (Start)
```bash
npm run start
```

### 5. Análise Estática (Linter)
```bash
npm run lint
```

---

## 📁 Estrutura de Pastas Principal

*   `src/lib/supabase.ts` — Inicializador seguro do cliente Supabase.
*   `src/types/database.types.ts` — Tipagem TypeScript baseada nas tabelas do banco.
*   `src/services/` — Camada lógica para comunicação direta com a API e banco de dados.
*   `src/hooks/` — Controle de estados reativos e manipulação de informações no front-end.
*   `src/pages/Login.tsx` — Fluxo e design do login administrativo.
*   `src/pages/Dashboard.tsx` — Painel principal de controle e controle de moderações.
*   `src/index.css` — Estilos visuais e regras do Design System.
