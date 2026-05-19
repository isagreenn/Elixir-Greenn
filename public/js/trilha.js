// ────────────────────────────────────────────────────────
// Trilha gamificada — XP, níveis, missões, avaliação de resumo
// ────────────────────────────────────────────────────────
function renderNivelGrid() {
  const grid = document.getElementById('nivel-grid');
  if (!grid) return;
  grid.innerHTML = NIVEIS.map((n, i) => {
    const ativo = i + 1 === nivelAtual;
    const concluido = i + 1 < nivelAtual;
    const bg = concluido ? n.cor : ativo ? n.cor + '22' : 'var(--bg3)';
    const border = concluido || ativo ? n.cor : 'var(--border)';
    const textC = concluido || ativo ? n.cor : 'var(--text3)';
    return `<div style="border-radius:var(--radius-sm);padding:8px;text-align:center;background:${bg};border:1px solid ${border}">
      <div style="font-size:16px;margin-bottom:3px">${concluido ? '✅' : ativo ? '⭐' : '🔒'}</div>
      <div style="font-size:10px;font-weight:500;color:${textC}">${n.nome}</div>
      <div style="font-size:9px;color:var(--text3);margin-top:2px">${n.xp} XP</div>
    </div>`;
  }).join('');
}

function renderMissoesList() {
  const lista = document.getElementById('missoes-lista');
  if (!lista) return;
  if (!missoesPend.length) {
    lista.innerHTML = `<div style="font-size:11px;color:var(--text3);text-align:center;padding:8px">Nenhuma missão ativa</div>`;
    return;
  }
  lista.innerHTML = missoesPend.map((m, i) => `
    <div style="display:flex;align-items:center;gap:7px;padding:7px 9px;background:var(--bg3);border-radius:var(--radius-sm);font-size:11px">
      <div style="flex:1"><div style="font-weight:500;color:var(--text)">${m.titulo}</div><div style="color:var(--text3)">${m.xp} XP · prazo ${m.prazo}</div></div>
      <button class="btn btn-sm" style="padding:3px 7px;font-size:10px" onclick="carregarMissao(${i})">Ativar</button>
    </div>
  `).join('');
}

function carregarMissao(i) {
  const m = missoesPend[i];
  if (!m) return;
  document.getElementById('missao-titulo').textContent = m.titulo;
  document.getElementById('missao-prazo').textContent = `Prazo: ${m.prazo} · Valor: ${m.xp} XP`;
  goTo('trilha-gamificada', document.querySelector('.nav-item.active'));
  showToast(`Missão "${m.titulo}" carregada!`, 'success');
}

function criarMissao() {
  const titulo = document.getElementById('missaoTitulo').value.trim();
  const xp = document.getElementById('missaoXP').value.trim() || '100';
  const prazo = document.getElementById('missaoPrazo').value.trim() || 'sem prazo';
  if (!titulo) { showToast('Informe o título da missão', 'error'); return; }
  missoesPend.push({ titulo, xp, prazo });
  localStorage.setItem('elixir_missoes_pend', JSON.stringify(missoesPend));
  document.getElementById('missaoTitulo').value = '';
  document.getElementById('missaoXP').value = '';
  document.getElementById('missaoPrazo').value = '';
  renderMissoesList();
  updateTrilhaKPIs();
  showToast(`Missão "${titulo}" criada!`, 'success');
}

async function avaliarResumo() {
  const resumo = document.getElementById('resumoInput').value.trim();
  const titulo = document.getElementById('missao-titulo').textContent;
  if (!resumo || resumo.length < 50) { showToast('Escreva um resumo mais completo (mínimo 50 caracteres)', 'error'); return; }
  setLoading('avaliacaoOutput', 'btnResumo', true, 'IA avaliando seu resumo...');
  try {
    const data = await callAI(
      `Avalie o resumo de leitura entregue por um membro do time da Greenn sobre o conteúdo: "${titulo}"\n\nResumo entregue:\n"${resumo}"\n\nAvalie com rigor mas construtividade.`
    );
    renderAvaliacaoOutput(data);
    xpTotal += (data.xp_ganho || 100);
    missoesOk++;
    localStorage.setItem('elixir_xp', xpTotal);
    localStorage.setItem('elixir_missoes_ok', missoesOk);
    updateTrilhaKPIs();
  } catch(e) {
    showToast(e.message, 'error');
    document.getElementById('avaliacaoOutput').style.display = 'none';
  }
  document.getElementById('btnResumo').disabled = false;
}

function renderAvaliacaoOutput(d) {
  const el = document.getElementById('avaliacaoInner');
  const notaColor = d.nota >= 80 ? 'var(--green-dark)' : d.nota >= 60 ? 'var(--amber)' : 'var(--red)';
  const notaBg = d.nota >= 80 ? 'var(--green-light)' : d.nota >= 60 ? 'var(--amber-light)' : 'var(--red-light)';
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;padding:12px;background:${notaBg};border-radius:var(--radius-md);margin-bottom:12px;border:1px solid ${notaColor}20">
      <div style="text-align:center;min-width:52px">
        <div style="font-family:var(--font-display);font-size:32px;font-weight:700;color:${notaColor};line-height:1">${d.nota}</div>
        <div style="font-size:10px;color:${notaColor};margin-top:2px">/100</div>
      </div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:500;color:var(--text)">${d.nivel_compreensao || ''}</div>
        <div style="font-size:11px;color:var(--text2);margin-top:2px">${d.conexao_trabalho || ''}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:18px;font-weight:500;color:var(--green)">+${d.xp_ganho || 0} XP</div>
        ${d.badge ? `<div style="font-size:10px;background:var(--green);color:#fff;padding:2px 8px;border-radius:20px;margin-top:4px">🏆 ${d.badge}</div>` : ''}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
      ${(d.pontos_captados||[]).length ? `
      <div class="result-field" style="margin-bottom:0">
        <div class="result-label">Pontos captados</div>
        <div class="criteria-list">
          ${d.pontos_captados.map(p => `<div class="criteria-item"><i class="ti ti-circle-check"></i>${p}</div>`).join('')}
        </div>
      </div>` : ''}
      ${(d.pontos_perdidos||[]).length ? `
      <div class="result-field" style="margin-bottom:0">
        <div class="result-label">Pontos para aprofundar</div>
        <div class="criteria-list">
          ${d.pontos_perdidos.map(p => `<div class="criteria-item"><i class="ti ti-alert-circle" style="color:var(--amber)"></i>${p}</div>`).join('')}
        </div>
      </div>` : ''}
    </div>

    <div class="result-field">
      <div class="result-label">Feedback para você</div>
      <div class="result-value" style="border-left:3px solid var(--green);border-radius:0 var(--radius-sm) var(--radius-sm) 0">${d.feedback_liderado || ''}</div>
    </div>

    <div class="result-field">
      <div class="result-label">Resumo para o gestor</div>
      <div class="result-value" style="border-left:3px solid var(--purple);border-radius:0 var(--radius-sm) var(--radius-sm) 0;background:var(--purple-light)"><i class="ti ti-user-star" style="color:var(--purple);font-size:11px;vertical-align:-1px"></i> <strong style="color:var(--purple)">${d.nivel_compreensao}</strong> — ${d.feedback_gestor || ''}</div>
    </div>

    <div class="btn-row">
      <button class="btn btn-sm" onclick="copyOutput('avaliacaoInner')"><i class="ti ti-copy"></i> Copiar avaliação</button>
      <button class="btn btn-sm btn-primary" onclick="document.getElementById('resumoInput').value='';document.getElementById('avaliacaoOutput').style.display='none';showToast('Missão concluída! XP adicionado.','success')"><i class="ti ti-check"></i> Concluir missão</button>
    </div>
  `;
  document.getElementById('avaliacaoOutput').style.display = 'block';
}

function updateTrilhaKPIs() {
  const xpEl = document.getElementById('xp-total');
  const nvEl = document.getElementById('nivel-atual');
  const okEl = document.getElementById('missoes-ok');
  const pdEl = document.getElementById('missoes-pend');
  if (xpEl) xpEl.innerHTML = `<span>${xpTotal}</span>`;
  if (nvEl) nvEl.innerHTML = `<span>${nivelAtual}</span>`;
  if (okEl) okEl.innerHTML = `<span>${missoesOk}</span>`;
  if (pdEl) pdEl.innerHTML = `<span>${missoesPend.length}</span>`;
  const bar = document.getElementById('xp-bar');
  const nivelXPBase = NIVEIS[nivelAtual - 1]?.xp || 0;
  const nivelXPNext = NIVEIS[nivelAtual]?.xp || 1000;
  const pct = Math.min(100, Math.round((xpTotal - nivelXPBase) / (nivelXPNext - nivelXPBase) * 100));
  if (bar) bar.style.width = pct + '%';
}
