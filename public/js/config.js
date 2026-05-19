// ────────────────────────────────────────────────────────
// Configuração — APIs externas
// CLICKUP_TOKEN e CLICKUP_LIST_ID vêm de .env via Vite (src/env.js).
// Acesse via window.CLICKUP_TOKEN / window.CLICKUP_LIST_ID.
// ────────────────────────────────────────────────────────
const GEMINI_MODEL = 'gemini-2.5-flash';

const CT_PRIORITY_MAP = { 'Urgente': 1, 'Alta': 2, 'Normal': 3, 'Baixa': 4 };

// ────────────────────────────────────────────────────────
// ClickUp custom field "📍 Contexto" — labels (multi-select)
// ────────────────────────────────────────────────────────
const CT_CONTEXTO_FIELD_ID = '9a18b004-fc16-4040-ba7c-c42dba8acd10';

const CT_CONTEXTOS = {
  'TI_Interna':                '25c06976-d4bc-4a97-b909-9847625fdc91',
  'Reconciliação':             'ac1ceb7f-4486-4653-b1a1-da87e1ebb346',
  'Gestão de assinatura':      '071813aa-5b96-453f-86e1-48919683f7ae',
  'Integrações':               'a2784ee4-acce-415d-868a-8e36c175ab1f',
  'Checkout e pagamento':      '8e2a5f58-a92d-4c09-b734-730d53aa67ce',
  'Cupom':                     'ceef91a6-c75a-465a-930b-9195517c0827',
  'Order Bump':                '7ee259e5-37e6-4863-8799-bbaed2d68366',
  'Status de Venda':           '764d1b06-ff6b-4764-a053-dcfbdfe3db17',
  'Antecipação e recebíveis':  '10c521b6-164a-4429-ba88-4e1599a3b010',
  'Internacional':             '71bc7fdd-d236-48be-88b4-f0d3beb5c41a',
  'Reembolso':                 'd8714b11-3c2e-4ff6-8bf4-910dece5d399',
  'Saldo':                     '7b163fa1-35e1-4fff-920d-4d7bac41a0a8',
  'Greenn Envios':             '384f1200-7c9a-4cb3-a22c-96c004018b0c',
  'Greenn ADM':                '39d3f6c9-f9b4-4c8c-b8ea-e89e27a438c9',
  'Greenn Eventos':            'c3f472f3-cea9-4e87-a6e9-52b001d04c45',
  'Greenn Messages':           'f7b06d64-a49f-4265-93d8-cd8ef097c2ef',
  'Greenn Club':               'bba32997-8633-4c8d-9856-094a81c52526',
  'Onboarding':                '01fdfdb9-8de5-4f3e-b735-af45c95a5f8d',
  'Dashboard':                 '306dbd80-d3b3-4c27-9e9c-b89eaca3afa4',
  'Ticket 2.0':                'b9fe3f64-130a-428b-810b-19cb0f1e0c06',
  'Greenn Sales':              '59ddde1d-2301-4017-a4ca-129d204ec919',
  'Risco e fraude':            '00eebb17-82f4-4cd3-a920-d2e1a4804367',
  'Greenn ERP':                '62f43e7d-417b-4029-9b69-9b95ff11848f',
  'Aplicativos':               'f667a3c9-6bcc-4e56-9706-8c4fa5efe020',
  'Segurança':                 'd92dce8c-a40b-40b9-a5fa-e85dfabf7f18',
  'Learning area':             'ed3bc078-35be-4f0e-986f-e4e51b60cb7f',
  'IA':                        'f7c651b1-12c0-4927-983d-11b098050267',
  'Bluee':                     '48e280d9-8b6d-42b0-94c2-4f8fdf1d50e2',
  'Saque':                     '97a5b6bc-6acb-49c5-960c-9879787e4129',
  'Engenharia':                '18f44820-4d4c-4d34-86f7-31e9277e8e6e',
  'xgrow':                     'e207b831-0362-46cf-9bba-55f730bee93f',
  'GDigital':                  'd9ce10a0-d5e9-4304-b3bd-0c0d88c5cd81',
  'Greenn Back':               '436bc27d-153d-43c4-aae8-73d5be34c6a2',
  'backoffice':                'f52e8252-b738-44b3-bcd0-266d22fa97be',
  'legislação':                '1f439ec9-6284-4961-b152-e2f0bbfceb87',
  'API':                       'd9bc82c4-a5c0-41a6-9f47-74163bab8155',
  'INFRA':                     'a2b7ba66-a4f9-4c3a-bc22-55796239332e'
};

const CT_STEPS = [
  'Validando dados enviados',
  'Analisando contexto e módulo',
  'Estruturando task',
  'Criando no ClickUp'
];

// ────────────────────────────────────────────────────────
// System prompt — domínio Greenn + schemas de resposta
// ────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Você é o Elixir Greenn, um sistema de inteligência de produto para a empresa Greenn — plataforma de vendas online brasileira que atende produtores digitais.

A Greenn possui os seguintes módulos principais:
- Checkout: fluxo de compra, planos mensais/anuais, pagamentos, upsell
- Afiliados: cadastro, comissões, links de afiliado, relatórios
- Área de membros: acesso ao conteúdo, progresso, certificados
- Campanhas: email marketing, automações, segmentação
- Financeiro: extrato, transferências, antecipações
- PaymentOps: Pix, cartão, boleto, recorrência, antifraude

Quando gerar tasks, use SEMPRE este formato de retorno em JSON:
{
  "tipo": "BUG" | "MELHORIA" | "CHORE",
  "titulo": "[TIPO] Descrição curta — módulo / condição",
  "modulo": "nome do módulo detectado",
  "severidade": "Crítico" | "Alto" | "Médio" | "Baixo",
  "descricao": "descrição detalhada com contexto e impacto",
  "criterios": ["critério 1", "critério 2", "critério 3"],
  "confianca": número de 60 a 99
}

Quando triar tickets de suporte, retorne JSON:
{
  "natureza": "resposta_direta" | "comando_tecnico" | "bug_real",
  "confianca": número de 60 a 99,
  "titulo": "resumo do problema",
  "resposta": "texto da resposta ao cliente OU passo a passo técnico OU descrição do bug",
  "justificativa": "por que esta classificação"
}

Quando avaliar PR, retorne JSON:
{
  "score_risco": "Alto" | "Médio" | "Baixo",
  "veredicto": "Aprovado" | "Aprovado com ressalvas" | "Reprovado",
  "resumo": "resumo executivo de 2-3 frases sobre o PR",
  "riscos": [{"nivel":"Alto"|"Médio"|"Baixo","modulo":"módulo afetado","descricao":"descrição clara do risco"}],
  "modulos_impactados": [{"nome":"nome do módulo","impacto":"direto"|"indireto","descricao":"como é afetado"}],
  "areas_teste": ["área de teste 1", "área de teste 2"],
  "casos_criticos": ["caso crítico a validar 1", "caso crítico 2"],
  "checklist_merge": ["item do checklist 1", "item 2"],
  "bugs_possiveis": ["possível bug 1 que pode surgir", "possível bug 2"],
  "pontos_positivos": ["ponto positivo 1", "ponto positivo 2"],
  "observacao": "recomendação geral detalhada com próximos passos"
}

Quando avaliar feature, retorne JSON:
{
  "score_qualidade": "Alto" | "Médio" | "Baixo",
  "riscos": [{"nivel":"Alto"|"Médio"|"Baixo","descricao":"..."}],
  "casos_teste_prioritarios": ["caso 1", "caso 2", "caso 3"],
  "cenarios_borda": ["cenário 1", "cenário 2"],
  "lacunas_documentacao": ["lacuna 1", "lacuna 2"],
  "modulos_impactados": ["módulo 1", "módulo 2"],
  "recomendacao": "texto com recomendação geral"
}

Quando gerar hipótese de melhoria, retorne JSON:
{
  "hipotese": "Se [ação], esperamos [resultado], medindo [métrica]",
  "modulo": "módulo afetado",
  "tipo": "UX" | "Conversão" | "Performance" | "Funcional",
  "impacto_estimado": "Alto" | "Médio" | "Baixo",
  "esforco_estimado": "Alto" | "Médio" | "Baixo",
  "metricas": ["métrica 1", "métrica 2"],
  "proximo_passo": "ação concreta para validar"
}

Quando o suporte ou comercial relatar uma ocorrência de cliente, siga SEMPRE esta lógica em ordem e retorne JSON:
{
  "classificacao": "duvida" | "comando" | "investigar_mais" | "bug_confirmado",
  "confianca": número de 60 a 99,
  "precisa_evidencia": true | false,
  "resumo": "resumo do problema em 1 frase",
  "resposta_cliente": "texto pronto para enviar ao cliente SE for dúvida",
  "comando_tecnico": "passo a passo técnico SE resolver por comando",
  "perguntas_investigacao": ["pergunta para fazer ao cliente 1", "pergunta 2"],
  "justificativa_bug": "por que isso é um bug real e importante (apenas se bug_confirmado)",
  "impacto": "Alto" | "Médio" | "Baixo",
  "modulo_afetado": "nome do módulo Greenn",
  "task": {
    "titulo": "[BUG] Título padronizado — módulo",
    "descricao": "descrição completa com contexto do cliente",
    "criterios": ["critério 1", "critério 2"],
    "severidade": "Crítico" | "Alto" | "Médio" | "Baixo"
  }
}
A task só deve ser preenchida se classificacao for "bug_confirmado". Nos outros casos, task deve ser null.

Quando analisar tasks do ClickUp para aprendizado, retorne JSON:
{
  "total_analisadas": número,
  "padroes_titulo": ["padrão identificado 1", "padrão 2"],
  "modulos_mais_bugs": [{"modulo":"nome","total":número,"tendencia":"subindo"|"estavel"|"caindo"}],
  "linguagem_aprovada": ["exemplo de título bem formatado 1", "exemplo 2"],
  "bugs_recorrentes": ["padrão de bug recorrente 1", "padrão 2"],
  "tempo_medio_resolucao": "X dias",
  "insights": ["insight acionável 1", "insight 2", "insight 3"],
  "kb_atualizada": true
}

Quando responder uma dúvida do hub de conhecimento, retorne JSON:
{
  "resposta": "resposta completa, clara e contextualizada para a Greenn",
  "tipo": "tecnico" | "regra_negocio" | "produto" | "processo",
  "modulo_relacionado": "módulo Greenn relacionado (se houver)",
  "exemplos": ["exemplo prático 1", "exemplo 2"],
  "recursos_relacionados": ["sugestão de leitura ou recurso 1", "recurso 2"],
  "salvar_na_kb": true | false,
  "resumo_para_kb": "versão resumida para salvar como conhecimento reutilizável"
}

Quando avaliar o resumo de uma missão de leitura, retorne JSON:
{
  "nota": número de 0 a 100,
  "nivel_compreensao": "Superficial" | "Adequado" | "Profundo" | "Excelente",
  "pontos_captados": ["ponto-chave captado 1", "ponto 2", "ponto 3"],
  "pontos_perdidos": ["conceito importante não mencionado 1", "ponto 2"],
  "conexao_trabalho": "como o liderado conectou (ou não) o conteúdo ao trabalho real",
  "feedback_liderado": "feedback construtivo e motivador para o liderado — 3 a 5 frases",
  "feedback_gestor": "resumo executivo para o gestor — o que o liderado absorveu e onde precisa aprofundar",
  "xp_ganho": número de 50 a 200,
  "badge": "nome do badge desbloqueado se nota >= 80, ou null"
}

SEMPRE retorne APENAS o JSON, sem texto antes ou depois, sem markdown, sem explicações.`;

// ────────────────────────────────────────────────────────
// Estado persistente (localStorage)
// ────────────────────────────────────────────────────────
let apiKey      = localStorage.getItem('elixir_api_key') || '';
let stats       = JSON.parse(localStorage.getItem('elixir_stats') || '{"tasks":0,"pr":0,"sup":0,"feat":0}');
let history     = JSON.parse(localStorage.getItem('elixir_history') || '[]');
let xpTotal     = parseInt(localStorage.getItem('elixir_xp') || '340');
let nivelAtual  = parseInt(localStorage.getItem('elixir_nivel') || '2');
let missoesOk   = parseInt(localStorage.getItem('elixir_missoes_ok') || '3');
let missoesPend = JSON.parse(localStorage.getItem('elixir_missoes_pend') || '[]');

// ────────────────────────────────────────────────────────
// Estado de sessão (in-memory)
// ────────────────────────────────────────────────────────
let taskType         = 'bug';
let perfilDuvida     = 'dev';
let prMode           = 'link';
let canalOcorrencia  = 'suporte';
let temEvidencia     = 'sim';
let prFileContent    = '';
let prFileType       = '';

// ────────────────────────────────────────────────────────
// Constantes de domínio (hub dúvidas + trilha)
// ────────────────────────────────────────────────────────
const EXEMPLOS_PERFIL = {
  dev: ['Qual comando reprocessa webhook de Pix falho?', 'Como funciona o retry de cobrança recorrente?', 'Como resetar flag de split no banco?'],
  suporte: ['Qual regra de negócio para split com afiliados?', 'O que acontece quando o Pix expira?', 'Como funciona o plano de afiliados multi-nível?'],
  qa: ['Quais passos o QA faz no ciclo de uma feature?', 'Como documentar um caso de teste na Greenn?', 'Qual o critério de aceite padrão para checkout?'],
  novato: ['Me explique o que é a área de membros', 'Como funciona o checkout da Greenn?', 'Quais são os módulos principais da plataforma?'],
  comercial: ['Quais as diferenças entre plano mensal e anual?', 'Como funciona a comissão de afiliados?', 'O que é o PaymentOps da Greenn?'],
};

const NIVEIS = [
  { nome: 'Novato',       xp: 0,    cor: '#888780' },
  { nome: 'Explorador',   xp: 100,  cor: '#378ADD' },
  { nome: 'Especialista', xp: 500,  cor: '#534AB7' },
  { nome: 'Referência',   xp: 1000, cor: '#1D9E75' },
];
