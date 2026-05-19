// ────────────────────────────────────────────────────────
// Página "Criar task com IA" (sidebar) — versão simples
// ────────────────────────────────────────────────────────
function setTaskType(type, btn) {
  taskType = type;
  document.querySelectorAll('#taskTypePills .type-pill').forEach(p => {
    p.className = 'type-pill';
  });
  btn.className = `type-pill active-${type === 'bug' ? 'bug' : type === 'melhoria' ? 'imp' : 'neu'}`;
}

async function gerarTask() {
  const input = document.getElementById('taskInput').value.trim();
  if (!input) { showToast('Descreva o problema antes de gerar', 'error'); return; }
  setLoading('taskOutput', 'btnGerarTask', true, 'Gerando task com IA...');
  try {
    const data = await callAI(
      `Gere uma task do tipo ${taskType.toUpperCase()} com base nesta descrição: "${input}"`
    );
    renderTaskOutput(data);
    stats.tasks++;
    updateStats();
  } catch(e) {
    showToast(e.message, 'error');
    document.getElementById('taskOutput').style.display = 'none';
  }
  document.getElementById('btnGerarTask').disabled = false;
}

function renderTaskOutput(d) {
  const el = document.getElementById('taskOutputInner');
  const tipo = (d.tipo || 'BUG').toLowerCase();
  const tagClass = tipo === 'bug' ? 'bug' : tipo === 'melhoria' ? 'imp' : 'neu';
  const titleClass = tipo === 'bug' ? 'bug-title' : tipo === 'melhoria' ? 'imp-title' : '';
  el.innerHTML = `
    <div class="tags-row">
      <span class="tag tag-${tagClass}">${d.tipo || 'BUG'}</span>
      <span class="tag tag-neu">${d.modulo || 'Módulo detectado'}</span>
      ${d.severidade ? `<span class="tag tag-${d.severidade === 'Crítico' || d.severidade === 'Alto' ? 'bug' : 'neu'}">${d.severidade}</span>` : ''}
    </div>
    <div class="result-field">
      <div class="result-label">Título</div>
      <div class="result-value title-val ${titleClass}">${d.titulo || ''}</div>
    </div>
    <div class="result-field">
      <div class="result-label">Descrição</div>
      <div class="result-value">${d.descricao || ''}</div>
    </div>
    <div class="result-field">
      <div class="result-label">Critérios de aceite</div>
      <div class="result-value">
        <div class="criteria-list">
          ${(d.criterios || []).map(c => `<div class="criteria-item"><i class="ti ti-circle-check"></i>${c}</div>`).join('')}
        </div>
      </div>
    </div>
    ${d.confianca ? `<div class="confidence-bar">Confiança da IA<div class="conf-track"><div class="conf-fill" style="width:${d.confianca}%;background:var(--green)"></div></div>${d.confianca}%</div>` : ''}
  `;
  document.getElementById('taskOutput').style.display = 'block';
  window._lastTask = d;
}

function clearTaskInput() {
  document.getElementById('taskInput').value = '';
  document.getElementById('taskOutput').style.display = 'none';
}
