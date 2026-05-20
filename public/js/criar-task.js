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
  window._ctExtraInfo = (window._ctExtraInfo || []).concat(['Resposta às dúvidas da IA: ' + v]);
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
  let active = 0;
  ctSetStep(0, 'active');

  const stepTimer = setInterval(() => {
    if (active < CT_STEPS.length - 1) {
      ctSetStep(active, 'done');
      active++;
      ctSetStep(active, 'active');
    }
  }, 900);

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
- Prioridade: ${prioridade}
- Observadores: ${observadores}
- Arquivos anexados: ${arquivosNomes}
${extras ? '\nInformações complementares já fornecidas:\n' + extras : ''}

# Formato de saída
O campo "status" é OBRIGATÓRIO. Retorne APENAS um destes dois JSONs, sem markdown:

Se INCOMPLETA (raro — só quando realmente não dá pra investigar):
{"status":"incompleta","duvidas":"Texto único listando TUDO que precisa ser esclarecido em parágrafo ou lista markdown. Seja direto."}

Se COMPLETA (caso padrão):
{"status":"completa","tipo":"BUG","titulo":"[Contexto] - Descrição breve do problema","modulo":"nome do módulo Greenn","severidade":"Crítico|Alto|Médio|Baixo","contextos":["Label 1","Label 2"],"confianca":85}

# Regra do campo "contextos"
"contextos" = array com 1 a 3 labels EXATOS da lista abaixo (case-sensitive). Escolha o(s) mais relevante(s) pro problema. Se em dúvida entre módulo macro e funcionalidade, prefira a funcionalidade (Status de Venda > Greenn ADM, Reembolso > Greenn ADM).

Lista válida de contextos (use o label EXATO):
${Object.keys(CT_CONTEXTOS).map(k => `- ${k}`).join('\n')}

Foque em gerar "titulo" no padrão correto + "contextos" certos — são os campos usados. NÃO estruture descrição, NÃO liste critérios, NÃO escreva passos. A descrição original do reporter vai pra task como está. Severidade default = Médio salvo se a descrição indicar bloqueio total (Crítico) ou cosmético (Baixo).`;

  try {
    taskType = 'bug';
    const data = await callAI(prompt);

    clearInterval(stepTimer);

    const duvidas = data.duvidas
      || (Array.isArray(data.perguntas) ? data.perguntas.join('\n- ') : data.perguntas);
    if (data.status === 'incompleta' && duvidas) {
      ctRenderQuestions(duvidas);
      ctSetActions('hidden');
    } else {
      ctSetStep(active, 'done');
      for (let i = active + 1; i < CT_STEPS.length - 1; i++) {
        ctSetStep(i, 'active');
        await ctSleep(380);
        ctSetStep(i, 'done');
      }
      ctSetStep(CT_STEPS.length - 1, 'active');
      const formInfo = { titulo, descricao, cliente, prioridade, observadores };
      const { id: taskId, url: taskUrl } = await ctCriarTaskClickUp(data, formInfo, arquivos);
      ctSetStep(CT_STEPS.length - 1, 'done');
      await ctSleep(350);
      ctRenderSuccess(data, taskUrl, taskId);
      ctSetActions('success');
      window._lastTask = { ...data, _clickup_url: taskUrl, _clickup_id: taskId };
      stats.tasks++;
      updateStats();
    }
  } catch(e) {
    clearInterval(stepTimer);
    showToast(e.message, 'error');
    outWrap.style.display = 'none';
    document.getElementById('ct_formView').style.display = 'block';
    ctSetActions('form');
  }
}
