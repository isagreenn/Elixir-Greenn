// ────────────────────────────────────────────────────────
// Sync e aprendizado a partir de tasks reais do ClickUp
// ────────────────────────────────────────────────────────
async function sincronizarClickUp() {
  const tasks = document.getElementById('clickupTasksInput').value.trim();
  if (!tasks) { showToast('Cole algumas tasks do ClickUp para análise', 'error'); return; }
  setLoading('clickupSyncOutput', 'btnSync', true, 'Estudando padrões do ClickUp...');
  try {
    const data = await callAI(
      `Analise estas tasks do ClickUp da Greenn e identifique padrões para enriquecer a knowledge base do Elixir Greenn:\n\n${tasks.substring(0, 6000)}`
    );
    renderClickUpSync(data);
  } catch(e) {
    showToast(e.message, 'error');
    document.getElementById('clickupSyncOutput').style.display = 'none';
  }
  document.getElementById('btnSync').disabled = false;
}

function renderClickUpSync(d) {
  const el = document.getElementById('clickupSyncInner');
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:12px">
      <div class="kpi-card">
        <div class="kpi-val"><span>${d.total_analisadas || '—'}</span></div>
        <div class="kpi-lbl">tasks analisadas</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-val"><span>${d.tempo_medio_resolucao || '—'}</span></div>
        <div class="kpi-lbl">tempo médio resolução</div>
      </div>
      <div class="kpi-card" style="background:var(--green-light)">
        <div class="kpi-val" style="font-size:18px">✓</div>
        <div class="kpi-lbl" style="color:var(--green-dark)">KB atualizada</div>
      </div>
    </div>

    ${(d.modulos_mais_bugs||[]).length ? `
    <div class="result-field">
      <div class="result-label">Módulos com mais bugs</div>
      <div style="display:flex;flex-direction:column;gap:4px">
        ${d.modulos_mais_bugs.map(m => `
          <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--bg3);border-radius:var(--radius-sm)">
            <span style="font-size:12px;font-weight:500;color:var(--text);flex:1">${m.modulo}</span>
            <span class="tag tag-${m.tendencia === 'subindo' ? 'bug' : m.tendencia === 'caindo' ? 'sup' : 'neu'}">${m.tendencia === 'subindo' ? '↑' : m.tendencia === 'caindo' ? '↓' : '→'} ${m.total} bugs</span>
          </div>`).join('')}
      </div>
    </div>` : ''}

    ${(d.insights||[]).length ? `
    <div class="result-field">
      <div class="result-label">Insights acionáveis para o time</div>
      <div class="criteria-list">
        ${d.insights.map(i => `<div class="criteria-item"><i class="ti ti-bulb"></i>${i}</div>`).join('')}
      </div>
    </div>` : ''}

    ${(d.bugs_recorrentes||[]).length ? `
    <div class="result-field">
      <div class="result-label">Padrões de bugs recorrentes detectados</div>
      <div class="criteria-list">
        ${d.bugs_recorrentes.map(b => `<div class="criteria-item"><i class="ti ti-alert-triangle"></i>${b}</div>`).join('')}
      </div>
    </div>` : ''}

    ${(d.linguagem_aprovada||[]).length ? `
    <div class="result-field">
      <div class="result-label">Exemplos de títulos bem formatados (agora na KB)</div>
      <div style="display:flex;flex-direction:column;gap:4px">
        ${d.linguagem_aprovada.map(l => `<div style="font-size:12px;font-family:var(--font-body);padding:5px 8px;background:var(--bg3);border-radius:5px;color:var(--text2)">${l}</div>`).join('')}
      </div>
    </div>` : ''}

    <div style="margin-top:12px;padding:10px 12px;background:var(--green-light);border-radius:var(--radius-sm);font-size:12px;color:var(--green-dark);border:1px solid rgba(29,158,117,.2)">
      <i class="ti ti-check" style="vertical-align:-2px"></i> <strong>Knowledge base enriquecida</strong> — todos esses padrões agora alimentam a geração de tasks, a triagem de suporte e a avaliação de PRs. O Elixir ficou mais inteligente.
    </div>
  `;
  document.getElementById('clickupSyncOutput').style.display = 'block';
}
