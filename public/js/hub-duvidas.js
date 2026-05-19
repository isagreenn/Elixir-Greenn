// ────────────────────────────────────────────────────────
// Hub de dúvidas — pergunta livre sobre Greenn
// ────────────────────────────────────────────────────────
function setPerfil(perfil, btn) {
  perfilDuvida = perfil;
  document.querySelectorAll('#perfilPills .type-pill').forEach(p => p.className = 'type-pill');
  btn.className = 'type-pill active-sup';
  renderExemplos();
}

function renderExemplos() {
  const chips = document.getElementById('exemplos-chips');
  if (!chips) return;
  const exs = EXEMPLOS_PERFIL[perfilDuvida] || [];
  chips.innerHTML = exs.map(e =>
    `<button class="btn btn-sm" style="font-size:10px;padding:3px 8px" onclick="document.getElementById('duvidaInput').value='${e.replace(/'/g,"\\'")}'">${e}</button>`
  ).join('');
}

async function responderDuvida() {
  const duvida = document.getElementById('duvidaInput').value.trim();
  if (!duvida) { showToast('Digite sua dúvida', 'error'); return; }
  setLoading('duvidaOutput', 'btnDuvida', true, 'Buscando resposta na base da Greenn...');
  document.getElementById('kbSavedPanel').style.display = 'none';
  try {
    const data = await callAI(
      `Sou um ${perfilDuvida} da Greenn e tenho esta dúvida: "${duvida}". Responda com contexto específico dos módulos e regras da Greenn.`
    );
    renderDuvidaOutput(data);
    stats.tasks++;
    updateStats();
  } catch(e) {
    showToast(e.message, 'error');
    document.getElementById('duvidaOutput').style.display = 'none';
  }
  document.getElementById('btnDuvida').disabled = false;
}

function renderDuvidaOutput(d) {
  const el = document.getElementById('duvidaOutputInner');
  const tipoMap = {
    tecnico:       ['Técnico', 'pr'],
    regra_negocio: ['Regra de negócio', 'imp'],
    produto:       ['Produto', 'sup'],
    processo:      ['Processo', 'neu']
  };
  const [tipoLabel, tipoTag] = tipoMap[d.tipo] || ['Geral', 'neu'];
  el.innerHTML = `
    <div class="tags-row">
      <span class="tag tag-${tipoTag}">${tipoLabel}</span>
      ${d.modulo_relacionado ? `<span class="tag tag-neu">${d.modulo_relacionado}</span>` : ''}
      ${d.salvar_na_kb ? `<span class="tag" style="background:var(--green-light);color:var(--green-dark);border-color:rgba(29,158,117,.3)"><i class="ti ti-database" style="font-size:10px"></i> Salvo na KB</span>` : ''}
    </div>
    <div class="result-field">
      <div class="result-label">Resposta</div>
      <div class="result-value" style="white-space:pre-line">${d.resposta || ''}</div>
    </div>
    ${(d.exemplos||[]).length ? `
    <div class="result-field">
      <div class="result-label">Exemplos práticos</div>
      <div class="criteria-list">
        ${d.exemplos.map(e => `<div class="criteria-item"><i class="ti ti-arrow-right"></i>${e}</div>`).join('')}
      </div>
    </div>` : ''}
    ${(d.recursos_relacionados||[]).length ? `
    <div class="result-field">
      <div class="result-label">Recursos relacionados</div>
      <div class="criteria-list">
        ${d.recursos_relacionados.map(r => `<div class="criteria-item"><i class="ti ti-book"></i>${r}</div>`).join('')}
      </div>
    </div>` : ''}
    <div class="btn-row">
      <button class="btn btn-sm" onclick="copyOutput('duvidaOutputInner')"><i class="ti ti-copy"></i> Copiar</button>
    </div>
  `;
  document.getElementById('duvidaOutput').style.display = 'block';
  if (d.salvar_na_kb && d.resumo_para_kb) {
    document.getElementById('kbSavedText').textContent = d.resumo_para_kb;
    document.getElementById('kbSavedPanel').style.display = 'block';
  }
}
