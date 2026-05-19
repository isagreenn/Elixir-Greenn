// ────────────────────────────────────────────────────────
// Relatar ocorrência (suporte / comercial)
// ────────────────────────────────────────────────────────
function setCanal(canal, btn) {
  canalOcorrencia = canal;
  document.querySelectorAll('#canalPills .type-pill').forEach(p => p.className = 'type-pill');
  btn.className = 'type-pill active-sup';
}

function setEvidencia(val, btn) {
  temEvidencia = val;
  document.querySelectorAll('#evidenciaPills .type-pill').forEach(p => p.className = 'type-pill');
  btn.className = 'type-pill active-sup';
}

function limparOcorrencia() {
  document.getElementById('ocorrenciaInput').value = '';
  document.getElementById('ocorrenciaLink').value = '';
  document.getElementById('ocorrenciaOutput').style.display = 'none';
}

async function avaliarOcorrencia() {
  const desc = document.getElementById('ocorrenciaInput').value.trim();
  if (!desc) { showToast('Descreva o problema do cliente', 'error'); return; }
  const link = document.getElementById('ocorrenciaLink').value.trim();
  const prompt = `O ${canalOcorrencia} relatou esta ocorrência de cliente: "${desc}". ${link ? `Link de evidência: ${link}.` : temEvidencia === 'nao' ? 'Nenhuma evidência visual foi fornecida.' : 'Evidência visual disponível mas não linkada.'} Canal: ${canalOcorrencia}. Avalie esta ocorrência seguindo a lógica de triagem do Elixir Greenn.`;
  setLoading('ocorrenciaOutput', 'btnOcorrencia', true, 'Avaliando a ocorrência...');
  try {
    const data = await callAI(prompt);
    renderOcorrenciaOutput(data);
    stats.sup++;
    updateStats();
  } catch(e) {
    showToast(e.message, 'error');
    document.getElementById('ocorrenciaOutput').style.display = 'none';
  }
  document.getElementById('btnOcorrencia').disabled = false;
}

function renderOcorrenciaOutput(d) {
  const el = document.getElementById('ocorrenciaOutputInner');
  const classMap = {
    duvida:          ['Dúvida do cliente',     'sup', '💬'],
    comando:         ['Resolução por comando', 'imp', '⚙️'],
    investigar_mais: ['Investigar mais',       'pr',  '🔍'],
    bug_confirmado:  ['Bug confirmado',        'bug', '🐛']
  };
  const [label, tagClass, icon] = classMap[d.classificacao] || ['Análise', 'neu', '📋'];
  const impactColor = d.impacto === 'Alto' ? 'var(--red)' : d.impacto === 'Médio' ? 'var(--amber)' : 'var(--green)';
  const impactBg = d.impacto === 'Alto' ? 'var(--red-light)' : d.impacto === 'Médio' ? 'var(--amber-light)' : 'var(--green-light)';

  let content = `
    <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:var(--radius-sm);margin-bottom:12px;background:var(--bg3);border:1px solid var(--border)">
      <span style="font-size:20px">${icon}</span>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:500;color:var(--text)">${label}</div>
        <div style="font-size:11px;color:var(--text2);margin-top:2px">${d.resumo || ''}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
        <span class="tag tag-${tagClass}">${label}</span>
        ${d.impacto ? `<span class="tag" style="background:${impactBg};color:${impactColor};border-color:${impactColor}20">Impacto ${d.impacto}</span>` : ''}
      </div>
    </div>`;

  if (d.classificacao === 'duvida' && d.resposta_cliente) {
    content += `
      <div class="result-field">
        <div class="result-label">Resposta pronta para enviar ao cliente</div>
        <div class="result-value" style="border-left:3px solid var(--green);border-radius:0 var(--radius-sm) var(--radius-sm) 0">${d.resposta_cliente}</div>
      </div>
      <div class="btn-row">
        <button class="btn btn-sm btn-primary" onclick="navigator.clipboard.writeText(document.querySelector('#ocorrenciaOutputInner .result-value').innerText);showToast('Resposta copiada!','success')">
          <i class="ti ti-copy"></i> Copiar resposta
        </button>
      </div>`;
  }

  if (d.classificacao === 'comando' && d.comando_tecnico) {
    content += `
      <div class="result-field">
        <div class="result-label">Passo a passo técnico para resolver</div>
        <div class="result-value" style="border-left:3px solid var(--blue);border-radius:0 var(--radius-sm) var(--radius-sm) 0;white-space:pre-line">${d.comando_tecnico}</div>
      </div>`;
  }

  if (d.classificacao === 'investigar_mais' && d.perguntas_investigacao?.length) {
    content += `
      <div class="result-field">
        <div class="result-label">Perguntas para fazer ao cliente antes de abrir qualquer task</div>
        <div class="criteria-list">
          ${d.perguntas_investigacao.map(q => `<div class="criteria-item"><i class="ti ti-question-mark"></i>${q}</div>`).join('')}
        </div>
      </div>`;
  }

  if (d.precisa_evidencia) {
    content += `
      <div style="background:var(--amber-light);border:1px solid rgba(186,117,23,.3);border-radius:var(--radius-sm);padding:10px 12px;margin-bottom:10px;font-size:12px;color:var(--amber)">
        <i class="ti ti-camera" style="vertical-align:-2px"></i> <strong>Evidência visual necessária</strong> — solicite ao cliente um vídeo ou print da tela mostrando o problema para confirmar o diagnóstico.
      </div>`;
  }

  if (d.classificacao === 'bug_confirmado') {
    content += `
      <div class="result-field">
        <div class="result-label">Por que é um bug real</div>
        <div class="result-value" style="border-left:3px solid var(--red);border-radius:0 var(--radius-sm) var(--radius-sm) 0">${d.justificativa_bug || ''}</div>
      </div>`;
    if (d.task) {
      content += `
        <div class="result-field">
          <div class="result-label" style="display:flex;align-items:center;gap:6px">
            <i class="ti ti-wand" style="color:var(--green)"></i> Task gerada automaticamente
          </div>
          <div class="result-value" style="background:var(--green-light);border-color:rgba(29,158,117,.3)">
            <div style="font-family:var(--font-display);font-size:13px;font-weight:700;color:var(--green-dark);margin-bottom:6px">${d.task.titulo || ''}</div>
            <div style="font-size:12px;color:var(--text2);margin-bottom:8px">${d.task.descricao || ''}</div>
            <div class="criteria-list">
              ${(d.task.criterios || []).map(c => `<div class="criteria-item"><i class="ti ti-circle-check"></i>${c}</div>`).join('')}
            </div>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn btn-sm" onclick="copyOutput('ocorrenciaOutputInner')"><i class="ti ti-copy"></i> Copiar</button>
          <button class="btn btn-sm btn-primary" onclick="showToast('Task enviada ao Elixir e ClickUp!','success')">
            <i class="ti ti-send"></i> Abrir no Elixir + ClickUp
          </button>
        </div>`;
    }
  }

  if (d.confianca) {
    content += `<div class="confidence-bar" style="margin-top:10px">Confiança da IA<div class="conf-track"><div class="conf-fill" style="width:${d.confianca}%;background:var(--green)"></div></div>${d.confianca}%</div>`;
  }

  el.innerHTML = content;
  document.getElementById('ocorrenciaOutput').style.display = 'block';
  window._lastOcorrencia = d;
}
