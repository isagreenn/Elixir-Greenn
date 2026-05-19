// ────────────────────────────────────────────────────────
// Avaliar feature
// ────────────────────────────────────────────────────────
async function avaliarFeature() {
  const nome = document.getElementById('featNome').value.trim();
  const desc = document.getElementById('featInput').value.trim();
  if (!desc) { showToast('Descreva a feature antes de avaliar', 'error'); return; }
  setLoading('featOutput', 'btnAvaliarFeat', true, 'Avaliando feature...');
  try {
    const data = await callAI(
      `Avalie esta feature da Greenn do ponto de vista de QA:\nNome: ${nome || 'não informado'}\nDescrição: ${desc}`
    );
    renderFeatOutput(data);
    stats.feat++;
    updateStats();
  } catch(e) {
    showToast(e.message, 'error');
    document.getElementById('featOutput').style.display = 'none';
  }
  document.getElementById('btnAvaliarFeat').disabled = false;
}

function renderFeatOutput(d) {
  const el = document.getElementById('featOutputInner');
  el.innerHTML = `
    <div class="tags-row">
      <span class="tag tag-${d.score_qualidade==='Alto'?'bug':d.score_qualidade==='Médio'?'imp':'sup'}">
        Complexidade ${d.score_qualidade || 'Médio'}
      </span>
      ${(d.modulos_impactados||[]).slice(0,2).map(m => `<span class="tag tag-neu">${m}</span>`).join('')}
    </div>
    <div class="result-field">
      <div class="result-label">Riscos de produto</div>
      <div style="display:flex;flex-direction:column;gap:5px">
        ${(d.riscos || []).map(r =>
          `<div class="risk-item risk-${r.nivel==='Alto'?'high':r.nivel==='Médio'?'med':'low'}">
            <span class="risk-dot"></span>${r.descricao}
          </div>`
        ).join('')}
      </div>
    </div>
    <div class="two-col" style="margin-top:12px">
      <div class="result-field">
        <div class="result-label">Casos de teste prioritários</div>
        <div class="criteria-list">
          ${(d.casos_teste_prioritarios||[]).map(c => `<div class="criteria-item"><i class="ti ti-test-pipe"></i>${c}</div>`).join('')}
        </div>
      </div>
      <div class="result-field">
        <div class="result-label">Cenários de borda</div>
        <div class="criteria-list">
          ${(d.cenarios_borda||[]).map(c => `<div class="criteria-item"><i class="ti ti-alert-circle"></i>${c}</div>`).join('')}
        </div>
      </div>
    </div>
    ${d.lacunas_documentacao?.length ? `
    <div class="result-field">
      <div class="result-label">Lacunas na documentação</div>
      <div class="criteria-list">
        ${d.lacunas_documentacao.map(l => `<div class="criteria-item"><i class="ti ti-file-alert"></i>${l}</div>`).join('')}
      </div>
    </div>` : ''}
    <div class="result-field">
      <div class="result-label">Recomendação</div>
      <div class="result-value" style="border-left:3px solid var(--amber);border-radius:0 var(--radius-sm) var(--radius-sm) 0">${d.recomendacao || ''}</div>
    </div>
  `;
  document.getElementById('featOutput').style.display = 'block';
  window._lastFeat = d;
}
