// ────────────────────────────────────────────────────────
// Modal "Criar task com IA" — fluxo Home → ClickUp
// ────────────────────────────────────────────────────────
function openCriarTaskModal() {
  document.getElementById('criarTaskModal').classList.add('open');
  document.getElementById('ct_outputWrap').style.display = 'none';
  document.getElementById('ct_formView').style.display = 'block';
  ctSetActions('form');
  window._ctExtraInfo = [];
  initCriarTaskDrop();
}

function openCriarTaskModalPrefill(titulo, descricao) {
  openCriarTaskModal();
  if (titulo)   document.getElementById('ct_titulo').value    = titulo;
  if (descricao) document.getElementById('ct_descricao').value = descricao;
}

function closeCriarTaskModal() {
  document.getElementById('criarTaskModal').classList.remove('open');
}

function ctSetActions(state) {
  const el = document.getElementById('ct_actions');
  if (state === 'form') {
    el.style.display = 'flex';
    el.innerHTML = `
      <button class="btn" onclick="closeCriarTaskModal()">Cancelar</button>
      <button class="btn btn-primary" id="btnGerarTaskModal" onclick="gerarTaskFromModal()">
        <i class="ti ti-sparkles"></i> Gerar task com IA
      </button>`;
  } else if (state === 'hidden') {
    el.style.display = 'none';
  } else if (state === 'success') {
    el.style.display = 'flex';
    el.innerHTML = `
      <button class="btn btn-primary" onclick="closeCriarTaskModal()">
        <i class="ti ti-check"></i> Concluir
      </button>`;
  }
}

let _ctDropInit = false;
function initCriarTaskDrop() {
  if (_ctDropInit) return;
  _ctDropInit = true;
  const drop = document.getElementById('ct_drop');
  const input = document.getElementById('ct_arquivos');
  const list = document.getElementById('ct_fileList');
  let files = [];

  function fmtSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024*1024) return (b/1024).toFixed(1) + ' KB';
    return (b/1024/1024).toFixed(1) + ' MB';
  }
  function syncInput() {
    const dt = new DataTransfer();
    files.forEach(f => dt.items.add(f));
    input.files = dt.files;
  }
  function render() {
    list.innerHTML = files.map((f, i) => `
      <div class="tm-file-item">
        <i class="ti ti-file"></i>
        <span class="tm-file-name">${f.name}</span>
        <span class="tm-file-size">${fmtSize(f.size)}</span>
        <button class="tm-file-remove" onclick="window._ctRemoveFile(${i})" aria-label="Remover"><i class="ti ti-x"></i></button>
      </div>
    `).join('');
    syncInput();
  }
  window._ctRemoveFile = (i) => { files.splice(i, 1); render(); };

  input.addEventListener('change', e => {
    files = files.concat(Array.from(e.target.files));
    render();
  });
  ['dragenter','dragover'].forEach(ev =>
    drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('dragover'); })
  );
  ['dragleave','drop'].forEach(ev =>
    drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('dragover'); })
  );
  drop.addEventListener('drop', e => {
    files = files.concat(Array.from(e.dataTransfer.files));
    render();
  });
}

// ────────────────────────────────────────────────────────
// Steps animados durante a geração
// ────────────────────────────────────────────────────────
function ctInitSteps() {
  const html = CT_STEPS.map((s, i) => `
    <div class="tm-step pending" data-step="${i}">
      <div class="tm-step-ico"><div class="tm-step-dot"></div></div>
      <div class="tm-step-label">${s}</div>
    </div>
  `).join('');
  document.getElementById('ct_outputInner').innerHTML = `<div class="tm-steps">${html}</div>`;
}

function ctSetStep(i, state) {
  const el = document.querySelector(`.tm-step[data-step="${i}"]`);
  if (!el) return;
  el.className = 'tm-step ' + state;
  const ico = el.querySelector('.tm-step-ico');
  if (state === 'done') ico.innerHTML = '<i class="ti ti-check"></i>';
  else if (state === 'active') ico.innerHTML = '<div class="tm-step-spinner"></div>';
  else ico.innerHTML = '<div class="tm-step-dot"></div>';
}

// ────────────────────────────────────────────────────────
// Estados: dúvidas / sucesso
// ────────────────────────────────────────────────────────
function ctRenderQuestions(duvidasTexto) {
  document.getElementById('ct_outputInner').innerHTML = `
    <div class="tm-questions">
      <div class="tm-questions-head">
        <i class="ti ti-info-circle"></i>
        <div>
          <h4>Faltam algumas informações</h4>
          <p>Responda os pontos abaixo pra IA gerar a task completa.</p>
        </div>
      </div>
      <div class="tm-duvidas-box">${ctEscapeHtml(duvidasTexto).replace(/\n/g, '<br>')}</div>
      <div class="tm-question">
        <label for="ct_resposta">Sua resposta</label>
        <textarea id="ct_resposta" rows="5" placeholder="Responda os pontos pedidos pela IA..."></textarea>
      </div>
      <div class="btn-row" style="margin-top:8px">
        <button class="btn btn-primary" onclick="ctEnviarRespostas()">
          <i class="ti ti-send"></i> Enviar resposta
        </button>
      </div>
    </div>
  `;
}

function ctEnviarRespostas() {
  const v = document.getElementById('ct_resposta').value.trim();
  if (!v) { showToast('Preencha a resposta', 'error'); return; }
  const duvidasEl = document.querySelector('.tm-duvidas-box');
  const perguntas = duvidasEl ? duvidasEl.innerText.trim() : '';
  const block = perguntas
    ? `Perguntas levantadas pela IA:\n${perguntas}\n\nResposta do reporter:\n${v}`
    : `Resposta às dúvidas da IA: ${v}`;
  window._ctExtraInfo = (window._ctExtraInfo || []).concat([block]);
  gerarTaskFromModal();
}

function ctRenderSuccess(data, taskUrl, taskId) {
  document.getElementById('ct_outputInner').innerHTML = `
    <div class="tm-success">
      <div class="tm-success-ico"><i class="ti ti-check"></i></div>
      <h3>Task criada com sucesso!</h3>
      <p>${data.titulo || 'Task de bug registrada no ClickUp'}</p>
      <a href="${taskUrl}" target="_blank" class="tm-success-link">
        <i class="ti ti-external-link"></i> Abrir no ClickUp
      </a>
      <span class="tm-success-id">ID: ${taskId}</span>
    </div>
  `;
}

// ────────────────────────────────────────────────────────
// Pipeline principal: form → IA → ClickUp
// ────────────────────────────────────────────────────────
async function gerarTaskFromModal() {
  const titulo       = document.getElementById('ct_titulo').value.trim();
  const descricao    = document.getElementById('ct_descricao').value.trim();
  const cliente      = document.getElementById('ct_cliente').value.trim();
  const origem       = document.getElementById('ct_origem')?.value.trim() || '';
  const prioridade   = document.getElementById('ct_prioridade').value;
  const observadores = document.getElementById('ct_observadores').value.trim();
  const arquivos     = document.getElementById('ct_arquivos').files;

  if (!titulo || !descricao || !cliente || !prioridade || !observadores) {
    showToast('Preencha os campos obrigatórios (*)', 'error'); return;
  }

  const outWrap = document.getElementById('ct_outputWrap');
  document.getElementById('ct_formView').style.display = 'none';
  ctSetActions('hidden');
  outWrap.style.display = 'block';

  ctInitSteps();
  // Step 0 — validação sync já feita
  ctSetStep(0, 'active');
  await ctSleep(220);
  ctSetStep(0, 'done');
  // Step 1 — análise IA (real wait)
  ctSetStep(1, 'active');

  const arquivosNomes = arquivos.length
    ? Array.from(arquivos).map(f => f.name).join(', ')
    : 'nenhum';

  const extras = (window._ctExtraInfo || []).join('\n');

  const prompt = `IGNORE o schema padrão do system prompt. Para esta requisição use estritamente o formato definido abaixo.

# Contexto do agente
Você é QA Senior da Greenn (plataforma SaaS de vendas digitais para produtores: Checkout, Afiliados, Área de Membros, Campanhas, Financeiro, PaymentOps). Sua função: transformar reports brutos de clientes em tasks de bug bem formatadas no ClickUp.

# Como agir
Seja PRAGMÁTICO. O reporter (analista interno ou suporte) já filtrou o ruído antes. Se a descrição do problema permite alguém começar a investigar, é SUFICIENTE — gere a task. Só pergunte se for IMPOSSÍVEL investigar sem aquela info.

Sinais de info suficiente (gere a task):
- Há ação do usuário + comportamento errado mencionado (ex: "ao clicar em X, aparece Y")
- Há módulo identificável pelo vocabulário (checkout, saque, afiliado, plano, etc)
- O cliente afetado está nomeado
- Existe título + descrição com ao menos uma frase concreta

Sinais de info insuficiente (peça mais):
- Descrição vaga sem ação nem efeito ("não funciona", "está bugado")
- Não dá pra inferir o módulo nem o fluxo afetado
- Falta totalmente o passo principal pra reproduzir

NÃO pergunte sobre: navegador/SO/versão (a menos que o report seja sobre comportamento visual específico), data/hora, plano do cliente — assuma o normal. NÃO duplique pergunta sobre coisa já mencionada na descrição.

# Evidências obrigatórias por ESCOPO (regra de bloqueio)
ANTES de classificar como "completa", identifique o ESCOPO do problema pelo vocabulário da descrição/título e exija as evidências mínimas do escopo. Se faltar QUALQUER evidência obrigatória do escopo detectado, marque "incompleta" e peça SÓ o que falta — sem repetir o que já está no report.

Como aplicar:
1. Detecte o escopo (pode ser mais de um).
2. Confira na descrição se cada evidência obrigatória está presente (e-mail, ID, URL, prints, etc).
3. Considera "presente" qualquer ocorrência razoável: e-mail no formato x@y, ID numérico ou alfanumérico mencionado como "ID/venda/pedido/transação", URL completa (https://...) ou domínio identificável (ex: pay.greenn.com.br/...).
4. Se faltar, retorne "incompleta" listando NOMINALMENTE o que precisa.

Tabela de escopos → evidências obrigatórias:

| Escopo (palavras-gatilho na descrição/título) | Evidências obrigatórias |
|-----------------------------------------------|-------------------------|
| Reembolso, "reembolso pendente", estorno | (e-mail do cliente final) OU (ID da venda/pedido/transação) |
| Status de venda, venda travada, "venda não aparece", reconciliação, saldo divergente, antecipação | (e-mail do cliente final) OU (ID da venda/pedido/transação) |
| Checkout (não abre, não passa, erro ao pagar), Order Bump, Cupom não aplica | URL completa do checkout afetado (Payfast / pay.greenn / link específico do produto) |
| Recusa de pagamento, cobrança recorrente, Pix expirado, cartão recusado | (ID da venda/transação) OU (e-mail do cliente final) + método de pagamento (Pix/cartão/boleto) |
| Afiliados, comissão, split | (e-mail do afiliado) OU (ID do produto/oferta) |
| Área de membros / Club, aula não abre, acesso negado | (e-mail do aluno) + (nome do produto/curso ou URL do módulo) |
| Saque | (e-mail do produtor) OU (ID do saque) |
| Aplicativo, mobile, app não abre | (modelo do aparelho) + (sistema operacional: iOS/Android) |
| Bug visual / layout quebrado | (print ou link de print) OU (navegador específico) |
| Integrações (webhook, postback, API externa) | (URL do webhook OU nome da integração) + (payload de exemplo OU ID da venda) |

Se o escopo não estiver na tabela, use o mesmo princípio: peça o identificador único do registro afetado (e-mail/ID/URL) que permita o dev reproduzir.

# REGRA OBRIGATÓRIA DE TÍTULO
O campo "titulo" DEVE seguir EXATAMENTE este padrão:
  [Contexto] - Descrição breve do problema

Exemplos válidos:
- [Reembolso pendente] - Usuário produtor relata venda com status reembolso pendente
- [Checkout] - Botão de confirmar travado no Safari iOS após preencher cartão
- [Afiliados] - Comissão calculando errado para afiliados multi-nível
- [Saque] - Mensagem de erro interno ao acessar tela de saque

Regras:
- "Contexto" entre colchetes = funcionalidade/tela/fluxo específico afetado (curto, em PT-BR, capitalizado). NÃO use o nome do módulo macro (Checkout, Afiliados) — use o sub-contexto preciso (Reembolso pendente, Status de venda, Split de comissão, etc).
- " - " (espaço hífen espaço) separa contexto e descrição.
- "Descrição breve" = uma frase curta começando com "Usuário produtor", "Cliente", "Sistema" ou o sujeito apropriado, descrevendo o sintoma observado.
- Se o título informado pelo usuário NÃO seguir esse padrão, reescreva-o seguindo o padrão a partir da descrição. NÃO mantenha o título original mal-formatado.

# Dados do report
- Título: ${titulo}
- Descrição: ${descricao}
- Cliente afetado: ${cliente}
- Origem do chamado: ${origem || '(não informado)'}
- Prioridade: ${prioridade}
- Observadores: ${observadores}
- Arquivos anexados: ${arquivosNomes}
${extras ? '\nInformações complementares já fornecidas:\n' + extras : ''}

# Formato de saída
O campo "status" é OBRIGATÓRIO. Retorne APENAS um destes dois JSONs, sem markdown:

Se INCOMPLETA (use sempre que faltar evidência obrigatória do escopo OU passos mínimos pra reproduzir):
{"status":"incompleta","duvidas":"Lista markdown numerada com cada item NOMEANDO a evidência que falta + por que é necessária. Seja específico — 'qual o e-mail do cliente afetado?' é melhor que 'mais detalhes'. Exemplos: '1. E-mail do cliente final ou ID da venda (sem isso não dá pra localizar o pedido no banco). 2. Link do checkout do Payfast onde o erro ocorre.'"}

Se COMPLETA (caso padrão):
{"status":"completa","tipo":"BUG","titulo":"[Contexto] - Descrição breve do problema","modulo":"nome do módulo Greenn","severidade":"Crítico|Alto|Médio|Baixo","contextos":["Label 1","Label 2"],"confianca":85}

# Regra do campo "contextos"
"contextos" = array com labels EXATOS da lista abaixo (case-sensitive).

REGRA DE QUANTIDADE — PREFIRA UM ÚNICO CONTEXTO.
- DEFAULT: 1 contexto. Esse é o caso esperado em ~90% dos reports.
- Só inclua 2 (no máximo) se o bug ATRAVESSA dois sub-contextos distintos do MESMO nível (ex: "Cupom não aplica no Checkout e pagamento" → ["Checkout e pagamento", "Cupom"]).
- NUNCA mais de 2.

PROIBIDO — módulos MACRO junto com sub-específico.
Se você já escolheu um sub-contexto específico (Reembolso, Status de Venda, Saque, Cupom, Order Bump, Reconciliação, Saldo, Antecipação e recebíveis, Checkout e pagamento, Gestão de assinatura, Integrações, Internacional, Risco e fraude, Onboarding, Dashboard, Ticket 2.0, Learning area, IA, Bluee, Engenharia, backoffice, legislação, API, INFRA, PCI, Gateway, Aplicativos, Segurança, Dashboard), NÃO adicione também o módulo macro correspondente.

Módulos macro (NÃO usar junto de um sub-contexto):
- Greenn ADM
- Greenn Sales
- Greenn Back
- Greenn ERP
- Greenn Club
- Greenn Eventos
- Greenn Messages
- Greenn Envios
- GDigital
- xgrow
- TI_Interna

Exemplos do que FAZER:
- "Venda com status reembolso pendente no produtor X" → ["Reembolso"] ✅ (NÃO ["Reembolso","Greenn ADM"])
- "Botão de pagar não funciona no checkout do Payfast" → ["Checkout e pagamento"] ✅
- "Cupom não aplica no checkout" → ["Checkout e pagamento", "Cupom"] ✅ (dois sub-contextos)
- "Saque travado em processando" → ["Saque"] ✅ (NÃO ["Saque","Greenn ADM"])
- "Comissão errada para afiliado multi-nível" → ["Greenn Sales"] ✅ (macro permitido SE não há sub-contexto melhor)

Lista válida de contextos (use o label EXATO):
${Object.keys(CT_CONTEXTOS).map(k => `- ${k}`).join('\n')}

Foque em gerar "titulo" no padrão correto + "contextos" certos — são os campos usados. NÃO estruture descrição, NÃO liste critérios, NÃO escreva passos. A descrição original do reporter vai pra task como está. Severidade default = Médio salvo se a descrição indicar bloqueio total (Crítico) ou cosmético (Baixo).`;

  try {
    taskType = 'bug';
    const data = await callAI(prompt);

    const duvidas = data.duvidas
      || (Array.isArray(data.perguntas) ? data.perguntas.join('\n- ') : data.perguntas);

    if (data.status === 'incompleta' && duvidas) {
      // Análise concluída mas com lacunas — pula etapas restantes, renderiza perguntas.
      ctSetStep(1, 'done');
      ctRenderQuestions(duvidas);
      ctSetActions('hidden');
      return;
    }

    // Step 1 done — IA analisou e classificou completa
    ctSetStep(1, 'done');
    // Step 2 — estruturação local (mapeia contextos, monta payload)
    ctSetStep(2, 'active');
    await ctSleep(380);
    ctSetStep(2, 'done');
    // Step 3 — chamada real ClickUp
    ctSetStep(3, 'active');
    const formInfo = { titulo, descricao, cliente, origem, prioridade, observadores };
    const { id: taskId, url: taskUrl } = await ctCriarTaskClickUp(data, formInfo, arquivos);
    ctSetStep(3, 'done');
    await ctSleep(280);
    ctRenderSuccess(data, taskUrl, taskId);
    ctSetActions('success');
    window._lastTask = { ...data, _clickup_url: taskUrl, _clickup_id: taskId };
    stats.tasks++;
    updateStats();
  } catch(e) {
    showToast(e.message, 'error');
    outWrap.style.display = 'none';
    document.getElementById('ct_formView').style.display = 'block';
    ctSetActions('form');
  }
}
