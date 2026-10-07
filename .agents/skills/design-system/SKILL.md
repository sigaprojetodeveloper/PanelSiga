---
name: design-system
description: >-
  Guia visual e de design system do SigaPanelAdmin: tokens de cores HSL, tipografia (Outfit e Plus Jakarta Sans), componentes padronizados (stat-cards, admin-table, buttons, badges, modals, filters) e regras de CSS Vanilla em src/index.css.
---

# 🎨 Design System & Padrões Visuais (SigaPanelAdmin)

Este documento descreve o **Design System oficial** do **SigaPanelAdmin**, centralizado no arquivo global [`src/index.css`](file:///home/gernano/workspace/antigravity/Projeto_Siga/ProjetoGlobal/SigaPanelAdmin/src/index.css). O projeto utiliza **CSS Vanilla puro com Design Tokens baseados em HSL**, sem o uso de TailwindCSS ou bibliotecas pesadas de terceiros.

---

## 1. Tokens Globais e Paleta de Cores (HSL Tailored)

A identidade visual utiliza um tema moderno em tons de vermelho institucional, branco, cinzas suaves e cores semânticas bem equilibradas.

```css
:root {
  /* Tipografia */
  --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-title: 'Outfit', system-ui, sans-serif;

  /* Cores Principais (Vermelho Institucional Siga) */
  --primary: hsl(0, 75%, 50%);                 /* #df2020 */
  --primary-hover: hsl(0, 75%, 42%);           /* #bc1b1b */
  --primary-light: hsla(0, 75%, 50%, 0.08);    /* Fundo sutil */
  --secondary: hsl(0, 0%, 95%);

  /* Superfícies e Fundos */
  --bg-app: hsl(0, 0%, 97%);                   /* #f7f7f7 */
  --bg-card: hsl(0, 0%, 100%);                 /* #ffffff */
  --bg-sidebar: hsl(0, 0%, 100%);              /* #ffffff */

  /* Textos */
  --text-main: hsl(0, 0%, 15%);                /* #262626 */
  --text-muted: hsl(0, 0%, 45%);               /* #737373 */
  --text-white: hsl(0, 0%, 100%);

  /* Bordas */
  --border-light: hsl(0, 0%, 88%);             /* #e0e0e0 */
  --border-focus: hsl(0, 75%, 50%);

  /* Cores de Status e Semântica */
  --success: hsl(142, 72%, 29%);               /* Verde escuro */
  --success-bg: hsl(142, 76%, 95%);            /* Fundo verde claro */
  --danger: hsl(0, 75%, 50%);                  /* Vermelho alerta */
  --danger-bg: hsl(0, 86%, 97%);               /* Fundo vermelho claro */
  --warning: hsl(38, 92%, 50%);                /* Amarelo/Laranja */
  --warning-bg: hsl(38, 96%, 95%);             /* Fundo amarelo claro */
  --info: hsl(217, 91%, 32%);                  /* Azul institucional */
  --info-bg: hsl(217, 96%, 96%);               /* Fundo azul claro */

  /* Sombras e Elevação */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -2px rgba(0, 0, 0, 0.02);

  /* Arredondamento (Border Radius) */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-full: 9999px;

  /* Transições Suaves */
  --transition-smooth: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 2. Tipografia e Hierarquia

* **Títulos e Cabeçalhos (`<h1>` até `<h6>`):** Fonte **Outfit** (`var(--font-title)`), pesos 600 a 800, visual limpo, moderno e com boa legibilidade.
* **Corpo de Texto, Tabelas e Inputs:** Fonte **Plus Jakarta Sans** (`var(--font-sans)`), pesos 400 (regular), 500 (médio) e 600 (semi-bold).

---

## 3. Componentes Padronizados do Painel

### 3.1 Cartões de Métricas e Indicadores (`stat-card`)
Usados no topo de telas analíticas como Visão Geral, Financeiro e Moderação:
```tsx
<div className="stat-card">
  <div className="stat-info">
    <h3>Total de Recusas</h3>
    <div className="stat-value" style={{ color: 'var(--danger)' }}>
      {stats.total}
    </div>
  </div>
  <div
    className="stat-icon-wrapper"
    style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', marginTop: '8px' }}
  >
    <ShieldAlert size={24} />
  </div>
</div>
```
* **Variações de Cor do Ícone:** Utilize classes ou cores semânticas como `var(--danger-bg)` + `var(--danger)`, `rgba(59, 130, 246, 0.1)` + `#3b82f6` (Azul), `rgba(168, 85, 247, 0.1)` + `#a855f7` (Roxo), etc.

### 3.2 Tabelas Administrativas (`admin-table`)
Estrutura padronizada para listagens de registros, usuários e solicitações:
```tsx
<div className="table-container">
  <div className="table-wrapper">
    <table className="admin-table">
      <thead>
        <tr>
          <th>Anúncio</th>
          <th>Solicitante</th>
          <th>Motivo</th>
          <th>Data</th>
          <th style={{ textAlign: 'center' }}>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr style={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
          <td>...</td>
          <td>...</td>
          <td>...</td>
          <td>...</td>
          <td style={{ textAlign: 'center' }}>
            <button className="btn btn-secondary btn-sm">Ver</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### 3.3 Botões (`.btn`)
* **Primário (Ação Principal):** `<button className="btn btn-primary">Salvar</button>` (fundo vermelho `var(--primary)`, texto branco).
* **Secundário (Neutro / Ação Secundária):** `<button className="btn btn-secondary">Cancelar</button>` (fundo cinza suave, borda leve).
* **Perigo / Recusa:** `<button className="btn btn-danger">Recusar Solicitação</button>` (fundo vermelho de alerta).
* **Tamanho Reduzido (Compacto):** Adicionar a classe `.btn-sm` (ex: `className="btn btn-secondary btn-sm"`).

### 3.4 Badges e Tags de Status (`.badge`)
Utilizados para classificar o estado de um registro:
* **Banner:** `<span className="badge badge-primary">Banner</span>`
* **Story:** `<span className="badge badge-info">Story</span>`
* **Aprovado / Sucesso:** `<span className="badge badge-success">Aprovado</span>`
* **Pendente / Atenção:** `<span className="badge badge-warning">Pendente</span>`
* **Recusado / Perigo:** `<span className="badge badge-danger">Recusado</span>`
* **Neutro / Secundário:** `<span className="badge badge-secondary">Expirado</span>`

### 3.5 Barra de Filtros e Busca (`filters-bar`)
Layout flexível que organiza filtros rápidos e inputs de busca:
```tsx
<div className="filters-bar">
  <div className="filters-group">
    <div className="filter-control">
      <label>Tipo</label>
      <div style={{ display: 'flex', gap: '8px', paddingTop: '6px' }}>
        <button className="btn btn-primary btn-sm">Todos</button>
        <button className="btn btn-secondary btn-sm">Banners</button>
      </div>
    </div>
  </div>

  <div className="filter-control">
    <label>Buscar</label>
    <div style={{ position: 'relative' }}>
      <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
      <input type="text" className="input-field" placeholder="Pesquisar..." style={{ paddingLeft: '34px' }} />
    </div>
  </div>
</div>
```

### 3.6 Modais Administrativos (`modal-overlay` & `modal-content`)
Padrão de modal com backdrop blur e scroll vertical contido:
```tsx
<div className="modal-overlay" style={{ zIndex: 1100 }} onClick={onClose}>
  <div
    className="modal-content"
    style={{ maxWidth: '800px', width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}
    onClick={(e) => e.stopPropagation()}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h3 className="modal-title">Título do Modal</h3>
      <button className="modal-close" onClick={onClose}><X size={20} /></button>
    </div>
    
    <div className="modal-body">
      {/* Conteúdo do Modal */}
    </div>
    
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
      <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
    </div>
  </div>
</div>
```

### 3.7 Animação de Carregamento (`.spinning`)
Quando um botão ou ícone de atualização estiver carregando:
```tsx
<RefreshCw size={14} className={loading ? 'spinning' : ''} />
```

---

## 4. Regras e Boas Práticas Visuais

1. **Não utilize TailwindCSS:** O projeto possui seu próprio ecossistema de classes e variáveis no `src/index.css`.
2. **Reaproveite variáveis CSS:** Sempre utilize `var(--border-light)`, `var(--text-muted)`, `var(--radius-md)`, etc., em vez de valores hexadecimais arbitrários.
3. **Micro-interações:** Toda linha de tabela clicável deve possuir `cursor: 'pointer'`, transição suave no hover e indicador claro da ação.
4. **Sem placeholders vazios:** Sempre exiba estados de carregamento elegantes (`spinning` ou skeleton) e estados vazios informativos com ícone e sugestão para o usuário quando não houver dados.
5. **Responsividade Garantida:** Todas as telas devem funcionar harmoniosamente em monitores widescreen (1920px), notebooks (1366px) e tablets/smartphones (com a gaveta móvel da Sidebar).
