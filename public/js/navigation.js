// ────────────────────────────────────────────────────────
// Navegação entre páginas + bootstrap (init)
// ────────────────────────────────────────────────────────
function goTo(pageId, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('p-' + pageId).classList.add('active');
  if (btn) btn.classList.add('active');
  const titles = {
    home:                  ['Home', 'Bem-vinda', 'var(--green-light)', 'var(--green-dark)', 'rgba(29,158,117,.3)'],
    'criar-task':          ['Criar task com IA', 'Skills de QA', 'var(--green-light)', 'var(--green-dark)', 'rgba(29,158,117,.3)'],
    'triar-suporte':       ['Triagem de suporte', 'Skills de QA', 'var(--blue-light)', 'var(--blue)', 'rgba(24,95,165,.3)'],
    'avaliar-pr':          ['Avaliar PR', 'Skills de QA', 'var(--purple-light)', 'var(--purple)', 'rgba(83,74,183,.3)'],
    'avaliar-feature':     ['Avaliar feature', 'Skills de QA', 'var(--amber-light)', 'var(--amber)', 'rgba(186,117,23,.3)'],
    melhoria:              ['Sugestão de melhoria', 'Skills de QA', 'var(--purple-light)', 'var(--purple)', 'rgba(83,74,183,.3)'],
    'suporte-ocorrencia':  ['Relatar ocorrência', 'Suporte / Comercial', 'var(--green-light)', 'var(--green-dark)', 'rgba(29,158,117,.3)'],
    'clickup-sync':        ['ClickUp — Sync e aprendizado', 'IA aprende com o ClickUp', 'var(--purple-light)', 'var(--purple)', 'rgba(83,74,183,.3)'],
    historico:             ['Histórico', 'Todas as tasks', 'var(--bg3)', 'var(--text2)', 'var(--border)'],
    'hub-duvidas':         ['Hub de dúvidas', 'Conhecimento', 'var(--green-light)', 'var(--green-dark)', 'rgba(29,158,117,.3)'],
    'trilha-gamificada':   ['Trilha gamificada', 'XP & Missões', 'var(--purple-light)', 'var(--purple)', 'rgba(83,74,183,.3)'],
    'dashboard-view':      ['Dashboard', 'Sprint atual', 'var(--green-light)', 'var(--green-dark)', 'rgba(29,158,117,.3)'],
    'qa-skills':           ['QA Skills', 'QA & Produto', 'var(--purple-light)', 'var(--purple)', 'rgba(83,74,183,.3)'],
    'feature-hub':         ['Feature Hub', 'QA & Produto', 'var(--purple-light)', 'var(--purple)', 'rgba(83,74,183,.3)'],
    reports:               ['Relatórios Sprint', 'Análise', 'var(--blue-light)', 'var(--blue)', 'rgba(24,95,165,.3)'],
    'mobile-feed':         ['Feed Mobile', 'Suporte / Comercial', 'var(--green-light)', 'var(--green-dark)', 'rgba(29,158,117,.3)'],
  };
  const t = titles[pageId] || ['', '', '', '', ''];
  document.getElementById('pageTitle').textContent = t[0];
  const badge = document.getElementById('pageBadge');
  badge.textContent = t[1];
  badge.style.background = t[2];
  badge.style.color = t[3];
  badge.style.borderColor = t[4];
}

function init() {
  updateApiStatus();
  updateStats();
  renderHistory();
  renderExemplos();
  renderNivelGrid();
  renderMissoesList();
  updateTrilhaKPIs();
}

init();
