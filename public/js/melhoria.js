// ────────────────────────────────────────────────────────
// Hipótese de melhoria
// ────────────────────────────────────────────────────────
async function gerarMelhoria() {
  const input = document.getElementById('melhoriaInput').value.trim();
  if (!input) { showToast('Descreva a fricção antes de gerar', 'error'); return; }
  setLoading('melhoriaOutput', 'btnMelhoria', true, 'Gerando hipótese...');
  try {
    const data = await callAI(`Gere uma hipótese de melhoria de produto para esta fricção: "${input}"`);
    renderMelhoriaOutput(data);
  } catch(e) {
    showToast(e.message, 'error');
    document.getElementById('melhoriaOutput').style.display = 'none';
  }
  document.getElementById('btnMelhoria').disabled = false;
}

function renderMelhoriaOutput(d) {
  const el = document.getElementById('melhoriaOutputInner');
  el.innerHTML = `
    <div class="tags-row">
      <span class="tag tag-neu">${d.modulo || ''}</span>
      <span class="tag tag-${d.tipo === 'UX' || d.tipo === 'Conversão' ? 'imp' : 'neu'}">${d.tipo || ''}</span>
      <span class="tag tag-${d.impacto_estimado === 'Alto' ? 'bug' : 'neu'}">Impacto ${d.impacto_estimado || ''}</span>
    </div>
    <div class="result-field">
      <div class="result-label">Hipótese</div>
      <div class="result-value" style="background:var(--purple-light);border-color:rgba(83,74,183,.3);color:var(--purple);font-style:italic">${d.hipotese || ''}</div>
    </div>
    <div class="two-col">
      <div class="result-field">
        <div class="result-label">Métricas para acompanhar</div>
        <div class="criteria-list">
          ${(d.metricas||[]).map(m => `<div class="criteria-item"><i class="ti ti-chart-bar"></i>${m}</div>`).join('')}
        </div>
      </div>
      <div class="result-field">
        <div class="result-label">Próximo passo</div>
        <div class="result-value" style="border-left:3px solid var(--purple);border-radius:0 var(--radius-sm) var(--radius-sm) 0">${d.proximo_passo || ''}</div>
      </div>
    </div>
  `;
  document.getElementById('melhoriaOutput').style.display = 'block';
}
