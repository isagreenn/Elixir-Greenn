// ────────────────────────────────────────────────────────
// Histórico de itens gerados (task / suporte / PR / feature)
// ────────────────────────────────────────────────────────
function salvarNoHistorico(tipo) {
  const safe = id => document.getElementById(id)?.value || '';
  const map = {
    task:    { data: window._lastTask, label: window._lastTask?.titulo },
    suporte: { data: window._lastSup,  label: window._lastSup?.titulo },
    pr:      { data: window._lastPR,   label: safe('prTituloLink') || safe('prTituloPDF') || safe('prTituloTexto') || 'PR avaliado' },
    feature: { data: window._lastFeat, label: safe('featNome') || 'Feature avaliada' }
  };
  const item = map[tipo];
  if (!item?.data) return;
  history.unshift({ tipo, label: item.label || 'Sem título', data: item.data, ts: Date.now() });
  if (history.length > 50) history.pop();
  localStorage.setItem('elixir_history', JSON.stringify(history));
  renderHistory();
  showToast('Salvo no histórico!', 'success');
}

function renderHistory() {
  const list = document.getElementById('historicoList');
  const homeList = document.getElementById('home-history-list');
  const count = history.length;
  document.getElementById('histCount').textContent = count;
  if (!count) {
    const empty = `<div class="empty-state"><i class="ti ti-history"></i>Nenhuma task salva ainda.</div>`;
    list.innerHTML = empty;
    homeList.innerHTML = `<div class="empty-state"><i class="ti ti-wand"></i>Nenhuma task gerada ainda.</div>`;
    return;
  }
  const colors = { task: 'tag-bug', suporte: 'tag-sup', pr: 'tag-pr', feature: 'tag-neu' };
  const labels = { task: 'Task', suporte: 'Suporte', pr: 'PR', feature: 'Feature' };
  const renderItem = (item) => `
    <div class="history-item" onclick="alert('${item.label?.replace(/'/g, "\\'")}')">
      <span class="hi-type tag ${colors[item.tipo] || 'tag-neu'}" style="font-size:9px">${labels[item.tipo] || item.tipo}</span>
      <div class="hi-body">
        <div class="hi-title">${item.label || 'Sem título'}</div>
        <div class="hi-meta">${new Date(item.ts).toLocaleDateString('pt-BR', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
      </div>
    </div>
  `;
  list.innerHTML = history.map(renderItem).join('');
  homeList.innerHTML = history.slice(0, 5).map(renderItem).join('');
}
