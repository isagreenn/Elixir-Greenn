// ────────────────────────────────────────────────────────
// Variáveis de ambiente — injetadas pelo Vite a partir do .env
// Expostas em window pra serem acessadas pelos scripts clássicos.
// ────────────────────────────────────────────────────────
window.CLICKUP_TOKEN   = import.meta.env.VITE_CLICKUP_TOKEN   || '';
window.CLICKUP_LIST_ID = import.meta.env.VITE_CLICKUP_LIST_ID || '';
