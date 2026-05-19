# Elixir Greenn — Protótipo v1.0

Painel de skills de QA com IA (Google Gemini) e integração com ClickUp para criação automática de tasks de bug.

## Setup

```bash
# 1. Instalar dependências
npm install

# 2. Copiar template de env e preencher
cp .env.example .env
# Edite .env com seus valores reais

# 3. Rodar em dev
npm run dev
```

Abre em `http://localhost:5173`. Configure a chave do Google Gemini no modal que abre na primeira execução (gere em [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)).

## Variáveis de ambiente

`.env` (gitignored):

```
VITE_CLICKUP_TOKEN=pk_xxxxxxxx
VITE_CLICKUP_LIST_ID=901108781754
```

- `VITE_CLICKUP_TOKEN`: Personal API token. ClickUp → avatar (canto inferior esquerdo) → Apps → API Token.
- `VITE_CLICKUP_LIST_ID`: último número da URL da lista (`https://app.clickup.com/.../v/li/901108781754`).

Vite injeta essas variáveis em tempo de execução via `src/env.js`, que expõe em `window.CLICKUP_TOKEN` e `window.CLICKUP_LIST_ID`.

## Scripts npm

| Comando         | O que faz                                |
| --------------- | ---------------------------------------- |
| `npm run dev`     | Dev server com HMR em `localhost:5173`   |
| `npm run build`   | Build de produção em `dist/`             |
| `npm run preview` | Servir build local pra testar            |

## Estrutura

```
.
├── index.html              # Entry point Vite
├── package.json
├── vite.config.js
├── .env                    # (gitignored) Variáveis de ambiente reais
├── .env.example            # Template de env
├── src/
│   └── env.js              # ES module — expõe import.meta.env em window
└── public/                 # Assets estáticos servidos como estão
    ├── css/
    │   ├── base.css        # Variáveis + reset
    │   ├── layout.css      # App, sidebar, main
    │   ├── components.css  # Painéis, botões, tags, toast
    │   ├── modals.css      # Modais (API key + criar task)
    │   └── pages.css       # Home, KPIs, ações rápidas
    └── js/
        ├── config.js           # Constantes + estado + system prompt
        ├── ui-helpers.js       # Toast, loading, clipboard, tema
        ├── api.js              # Chamadas Gemini + ClickUp
        ├── api-modal.js        # Modal de config da API key
        ├── history.js          # Histórico no localStorage
        ├── criar-task.js       # Modal Home → IA → ClickUp
        ├── criar-task-page.js  # Página simples (sidebar)
        ├── triar-suporte.js
        ├── avaliar-pr.js
        ├── avaliar-feature.js
        ├── melhoria.js
        ├── suporte-ocorrencia.js
        ├── clickup-sync.js
        ├── hub-duvidas.js
        ├── trilha.js           # Gamificação (XP, missões)
        └── navigation.js       # goTo + init
```

## Stack

- Vanilla HTML/CSS/JS
- [Vite](https://vitejs.dev/) — dev server + build + env injection
- Google Gemini API (`gemini-2.5-flash`)
- ClickUp REST API v2
- Fontes: Syne + DM Sans (Google Fonts)
- Ícones: Tabler Icons (CDN)

## Segurança

`.env` é gitignored. Tokens nunca vão pro repositório.
