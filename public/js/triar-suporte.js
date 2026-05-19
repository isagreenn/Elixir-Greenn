// ────────────────────────────────────────────────────────
// Triar ticket de suporte
// ────────────────────────────────────────────────────────
async function triarSuporteIA() {
  const input = document.getElementById('suporteInput').value.trim();
  if (!input) { showToast('Cole o ticket antes de analisar', 'error'); return; }
  setLoading('suporteOutput', 'btnTriar', true, 'Triando ticket...');
  try {
    const data = await callAI(`Trie este ticket de suporte: "${input}"`);
    renderSuporteOutput(data);
    stats.sup++;
    updateStats();
  } catch(e) {
    showToast(e.message, 'error');
    document.getElementById('suporteOutput').style.display = 'none';
  }
  document.getElementById('btnTriar').disabled = false;
}

function renderSuporteOutput(d) {
  const el = document.getElementById('suporteOutputInner');
  const nat = d.natureza || 'resposta_direta';
  const labels = {
    resposta_direta: ['Dúvida / configuração', 'sup'],
    comando_tecnico: ['Resolução técnica', 'imp'],
    bug_real:        ['Bug confirmado', 'bug']
  };
  const [label, tagClass] = labels[nat] || labels.resposta_direta;
  el.innerHTML = `
    <div class="tags-row">
      <span class="tag tag-${tagClass}">${label}</span>
    </div>
    ${d.confianca ? `<div class="confidence-bar">Confiança<div class="conf-track"><div class="conf-fill" style="width:${d.confianca}%;background:var(--green)"></div></div>${d.confianca}%</div>` : ''}
    <div class="result-field">
      <div class="result-label">${nat === 'resposta_direta' ? 'Resposta para enviar ao cliente' : nat === 'comando_tecnico' ? 'Passo a passo técnico' : 'Task a ser aberta'}</div>
      <div class="result-value">${d.resposta || ''}</div>
    </div>
    <div class="result-field">
      <div class="result-label">Justificativa da classificação</div>
      <div class="result-value" style="font-size:12px;color:var(--text2)">${d.justificativa || ''}</div>
    </div>
  `;
  document.getElementById('suporteOutput').style.display = 'block';
  window._lastSup = d;
}
