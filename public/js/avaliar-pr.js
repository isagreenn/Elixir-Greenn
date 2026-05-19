// ────────────────────────────────────────────────────────
// Avaliar PR — três modos: link, PDF/arquivo, texto
// ────────────────────────────────────────────────────────
function setPRMode(mode, btn) {
  prMode = mode;
  document.querySelectorAll('#prModePills .type-pill').forEach(p => p.className = 'type-pill');
  btn.className = `type-pill active-pr`;
  ['link','pdf','texto'].forEach(m => {
    const el = document.getElementById(`pr-mode-${m}`);
    if (el) el.style.display = m === mode ? 'block' : 'none';
  });
}

function dragOver(e) {
  e.preventDefault();
  document.getElementById('pdfDropZone').style.borderColor = 'var(--purple)';
  document.getElementById('pdfDropZone').style.background = 'var(--purple-light)';
}
function dragLeave(e) {
  document.getElementById('pdfDropZone').style.borderColor = 'var(--border2)';
  document.getElementById('pdfDropZone').style.background = '';
}
function dropFile(e) {
  e.preventDefault();
  dragLeave(e);
  const file = e.dataTransfer.files[0];
  if (file) processFile(file);
}
function handleFileSelect(input) {
  if (input.files[0]) processFile(input.files[0]);
}
function processFile(file) {
  if (file.size > 10 * 1024 * 1024) { showToast('Arquivo muito grande. Máx 10MB.', 'error'); return; }
  prFileType = file.type;
  const nameEl = document.getElementById('pdfFileName');
  nameEl.textContent = `✓ ${file.name} (${(file.size/1024).toFixed(0)}KB)`;
  nameEl.style.display = 'block';
  document.getElementById('pdfDropZone').style.borderColor = 'var(--green)';
  const reader = new FileReader();
  reader.onload = e => {
    if (file.type === 'application/pdf') {
      prFileContent = `[Arquivo PDF: ${file.name}]\n${e.target.result.substring(0, 8000)}`;
    } else {
      prFileContent = e.target.result.substring(0, 12000);
    }
  };
  if (file.type === 'application/pdf') {
    reader.readAsBinaryString(file);
  } else {
    reader.readAsText(file);
  }
}

function limparPR() {
  ['prLinkUrl','prTituloLink','prArquivos','prDescLink','prTituloPDF','prContextoPDF','prInputTexto','prTituloTexto'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  prFileContent = '';
  document.getElementById('pdfFileName').style.display = 'none';
  document.getElementById('pdfDropZone').style.borderColor = 'var(--border2)';
  document.getElementById('pdfDropZone').style.background = '';
  document.getElementById('prOutput').style.display = 'none';
}

async function avaliarPR() {
  let titulo = '', conteudo = '', contexto = '';

  if (prMode === 'link') {
    const url = document.getElementById('prLinkUrl').value.trim();
    titulo = document.getElementById('prTituloLink').value.trim();
    const arquivos = document.getElementById('prArquivos').value.trim();
    const desc = document.getElementById('prDescLink').value.trim();
    if (!url && !titulo && !desc) { showToast('Informe pelo menos o link ou uma descrição do PR', 'error'); return; }
    conteudo = `Link do PR: ${url || 'não informado'}\nTítulo: ${titulo || 'não informado'}\nArquivos alterados:\n${arquivos || 'não informado'}\nDescrição das mudanças:\n${desc || 'não informada'}`;
  } else if (prMode === 'pdf') {
    titulo = document.getElementById('prTituloPDF').value.trim();
    contexto = document.getElementById('prContextoPDF').value.trim();
    if (!prFileContent) { showToast('Faça upload de um arquivo antes de analisar', 'error'); return; }
    conteudo = `Título: ${titulo || 'não informado'}\nConteúdo do arquivo:\n${prFileContent}\nContexto adicional: ${contexto || 'nenhum'}`;
  } else {
    titulo = document.getElementById('prTituloTexto').value.trim();
    const desc = document.getElementById('prInputTexto').value.trim();
    if (!desc) { showToast('Descreva as mudanças do PR', 'error'); return; }
    conteudo = `Título: ${titulo || 'não informado'}\nDescrição/diff:\n${desc}`;
  }

  setLoading('prOutput', 'btnAvaliarPR', true, 'Analisando impacto nos módulos da Greenn...');
  document.getElementById('prReportPanel').style.display = 'none';

  try {
    const data = await callAI(
      `Avalie este Pull Request da Greenn com análise completa de impacto nos módulos do sistema:\n\n${conteudo}`
    );
    renderPROutput(data, titulo || 'PR sem título');
    const report = gerarRelatorioPR(data, titulo || 'PR sem título', conteudo);
    renderRelatorioPR(report);
    window._lastPRReport = report;
    stats.pr++;
    updateStats();
  } catch(e) {
    showToast(e.message, 'error');
    document.getElementById('prOutput').style.display = 'none';
  }
  document.getElementById('btnAvaliarPR').disabled = false;
}

function renderPROutput(d, titulo) {
  const el = document.getElementById('prOutputInner');
  const vColor = d.veredicto === 'Aprovado' ? 'var(--green-dark)' : d.veredicto === 'Aprovado com ressalvas' ? 'var(--amber)' : 'var(--red)';
  const vBg = d.veredicto === 'Aprovado' ? 'var(--green-light)' : d.veredicto === 'Aprovado com ressalvas' ? 'var(--amber-light)' : 'var(--red-light)';
  const scoreColor = d.score_risco === 'Alto' ? 'var(--red)' : d.score_risco === 'Médio' ? 'var(--amber)' : 'var(--green)';
  const scoreBg = d.score_risco === 'Alto' ? 'var(--red-light)' : d.score_risco === 'Médio' ? 'var(--amber-light)' : 'var(--green-light)';

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:${vBg};border-radius:var(--radius-sm);margin-bottom:12px;border:1px solid ${vColor}20">
      <span style="font-size:18px">${d.veredicto === 'Aprovado' ? '✅' : d.veredicto === 'Aprovado com ressalvas' ? '⚠️' : '❌'}</span>
      <div>
        <div style="font-size:13px;font-weight:500;color:${vColor}">${d.veredicto || 'Sem veredicto'}</div>
        <div style="font-size:11px;color:var(--text2);margin-top:1px">${d.resumo || ''}</div>
      </div>
      <span class="tag" style="margin-left:auto;background:${scoreBg};color:${scoreColor};border-color:${scoreColor}20">Risco ${d.score_risco || ''}</span>
    </div>

    ${(d.modulos_impactados||[]).length ? `
    <div class="result-field">
      <div class="result-label">Módulos da Greenn impactados</div>
      <div style="display:flex;flex-direction:column;gap:5px">
        ${d.modulos_impactados.map(m => `
          <div style="display:flex;gap:8px;align-items:flex-start;padding:7px 10px;background:var(--bg3);border-radius:var(--radius-sm);border:1px solid var(--border)">
            <span class="tag tag-${m.impacto === 'direto' ? 'bug' : 'neu'}" style="flex-shrink:0;margin-top:1px">${m.impacto}</span>
            <div>
              <div style="font-size:12px;font-weight:500;color:var(--text)">${m.nome}</div>
              <div style="font-size:11px;color:var(--text2);margin-top:2px">${m.descricao}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>` : ''}

    <div class="result-field">
      <div class="result-label">Riscos identificados</div>
      <div style="display:flex;flex-direction:column;gap:5px">
        ${(d.riscos || []).map(r => `
          <div class="risk-item risk-${r.nivel==='Alto'?'high':r.nivel==='Médio'?'med':'low'}">
            <span class="risk-dot"></span>
            <div style="flex:1">
              <span style="font-weight:500">${r.modulo ? `[${r.modulo}] ` : ''}</span>${r.descricao}
            </div>
          </div>`).join('')}
      </div>
    </div>

    ${(d.bugs_possiveis||[]).length ? `
    <div class="result-field">
      <div class="result-label">Bugs que podem surgir</div>
      <div class="criteria-list">
        ${d.bugs_possiveis.map(b => `<div class="criteria-item"><i class="ti ti-bug"></i>${b}</div>`).join('')}
      </div>
    </div>` : ''}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
      <div class="result-field" style="margin-bottom:0">
        <div class="result-label">Áreas que precisam de teste</div>
        <div class="criteria-list">
          ${(d.areas_teste||[]).map(a => `<div class="criteria-item"><i class="ti ti-test-pipe"></i>${a}</div>`).join('')}
        </div>
      </div>
      <div class="result-field" style="margin-bottom:0">
        <div class="result-label">Casos críticos a validar</div>
        <div class="criteria-list">
          ${(d.casos_criticos||[]).map(c => `<div class="criteria-item"><i class="ti ti-alert-triangle"></i>${c}</div>`).join('')}
        </div>
      </div>
    </div>

    ${(d.pontos_positivos||[]).length ? `
    <div class="result-field">
      <div class="result-label">Pontos positivos do PR</div>
      <div class="criteria-list">
        ${d.pontos_positivos.map(p => `<div class="criteria-item"><i class="ti ti-circle-check" style="color:var(--green)"></i>${p}</div>`).join('')}
      </div>
    </div>` : ''}

    <div class="result-field">
      <div class="result-label">Checklist antes do merge</div>
      <div class="criteria-list">
        ${(d.checklist_merge||[]).map(c => `<div class="criteria-item"><i class="ti ti-square-check"></i>${c}</div>`).join('')}
      </div>
    </div>

    <div class="result-field">
      <div class="result-label">Recomendação</div>
      <div class="result-value" style="border-left:3px solid var(--purple);border-radius:0 var(--radius-sm) var(--radius-sm) 0">${d.observacao || ''}</div>
    </div>
  `;
  document.getElementById('prOutput').style.display = 'block';
  window._lastPR = d;
}

function gerarRelatorioPR(d, titulo, input) {
  const now = new Date();
  const dt = now.toLocaleDateString('pt-BR', {day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const linhas = [
    '═══════════════════════════════════════════════════════════',
    '  ELIXIR GREENN · RELATÓRIO DE AVALIAÇÃO DE PR',
    '═══════════════════════════════════════════════════════════',
    '',
    `PR: ${titulo}`,
    `Data: ${dt}`,
    `Veredicto: ${d.veredicto || 'N/A'}`,
    `Risco: ${d.score_risco || 'N/A'}`,
    '',
    '───────────────────────────────────────────────────────────',
    '  RESUMO EXECUTIVO',
    '───────────────────────────────────────────────────────────',
    d.resumo || '',
    '',
    '───────────────────────────────────────────────────────────',
    '  MÓDULOS IMPACTADOS',
    '───────────────────────────────────────────────────────────',
    ...(d.modulos_impactados||[]).map(m => `  [${m.impacto.toUpperCase()}] ${m.nome}: ${m.descricao}`),
    '',
    '───────────────────────────────────────────────────────────',
    '  RISCOS IDENTIFICADOS',
    '───────────────────────────────────────────────────────────',
    ...(d.riscos||[]).map(r => `  [${r.nivel.toUpperCase()}]${r.modulo ? ` ${r.modulo} —` : ''} ${r.descricao}`),
    '',
    '───────────────────────────────────────────────────────────',
    '  BUGS QUE PODEM SURGIR',
    '───────────────────────────────────────────────────────────',
    ...(d.bugs_possiveis||[]).map(b => `  • ${b}`),
    '',
    '───────────────────────────────────────────────────────────',
    '  ÁREAS QUE PRECISAM DE TESTE',
    '───────────────────────────────────────────────────────────',
    ...(d.areas_teste||[]).map(a => `  • ${a}`),
    '',
    '───────────────────────────────────────────────────────────',
    '  CASOS CRÍTICOS A VALIDAR',
    '───────────────────────────────────────────────────────────',
    ...(d.casos_criticos||[]).map(c => `  • ${c}`),
    '',
    '───────────────────────────────────────────────────────────',
    '  PONTOS POSITIVOS',
    '───────────────────────────────────────────────────────────',
    ...(d.pontos_positivos||[]).map(p => `  ✓ ${p}`),
    '',
    '───────────────────────────────────────────────────────────',
    '  CHECKLIST ANTES DO MERGE',
    '───────────────────────────────────────────────────────────',
    ...(d.checklist_merge||[]).map(c => `  [ ] ${c}`),
    '',
    '───────────────────────────────────────────────────────────',
    '  RECOMENDAÇÃO',
    '───────────────────────────────────────────────────────────',
    d.observacao || '',
    '',
    '═══════════════════════════════════════════════════════════',
    `  Gerado pelo Elixir Greenn · ${dt}`,
    '═══════════════════════════════════════════════════════════',
  ];
  return linhas.join('\n');
}

function renderRelatorioPR(report) {
  const panel = document.getElementById('prReportPanel');
  const inner = document.getElementById('prReportInner');
  const ts = document.getElementById('prReportTs');
  inner.textContent = report;
  ts.textContent = new Date().toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'});
  panel.style.display = 'block';
}

function downloadReport() {
  if (!window._lastPRReport) return;
  const blob = new Blob([window._lastPRReport], {type: 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `elixir-greenn-pr-report-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Relatório baixado!', 'success');
}
