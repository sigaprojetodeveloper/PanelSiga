# Siga - Painel Administrativo Web

Este é o Painel Administrativo Web para a plataforma **Siga**, desenvolvido em **React**, **TypeScript**, **Vite** e estilizado com um Design System premium glassmórfico. Ele fornece recursos de controle de moderação de denúncias, gerenciamento de usuários e publicação de stories integrados diretamente ao banco de dados do **Supabase**.

---

## 🛠️ Pré-requisitos e Configuração

Antes de iniciar, certifique-se de que possui o **Node.js** instalado em sua máquina.

### Variáveis de Ambiente

Crie ou edite o arquivo `.env` na raiz da pasta `SigaPanelAdmin` com os seguintes parâmetros obtidos da sua instância do Supabase:

```env
VITE_SUPABASE_URL=https://sua-url-do-supabase.supabase.co
VITE_SUPABASE_ANON_KEY=seu-token-public-anon
```

---

## 🚀 Comandos de Execução e Modos de Operação

Na raiz do projeto (`SigaPanelAdmin`), utilize os seguintes comandos do NPM:

### 1. Instalação de Dependências
Para instalar todas as bibliotecas necessárias para executar e construir o projeto:
```bash
npm install
```

### 2. Servidor de Desenvolvimento
Para iniciar o servidor local com Hot Module Replacement (HMR):
```bash
npm run dev
```
O painel estará disponível em `http://localhost:5173`.

### 3. Compilação (Build)
Para validar os tipos do TypeScript e compilar os arquivos otimizados para produção:
```bash
npm run build
```
Esse comando gera os artefatos estáticos prontos para distribuição no diretório `/dist`.

### 4. Limpeza (Clean)
Caso queira remover a compilação anterior (limpar a pasta de build) para garantir que uma nova compilação seja feita do zero:
```bash
npm run clean
```

### 5. Pré-visualização Local do Build
Para testar localmente o build de produção gerado na pasta `/dist`:
```bash
npm run preview
```

### 6. Análise Estática (Linter)
Para validar o código contra regras estritas do ESLint e garantir qualidade de formatação e padrões do React/TypeScript:
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
