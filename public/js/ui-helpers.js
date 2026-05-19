// ────────────────────────────────────────────────────────
// Toast, loading, clipboard, tema, helpers gerais
// ────────────────────────────────────────────────────────
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function setLoading(outputId, btnId, loading, msg = 'Analisando com IA...') {
  const out = document.getElementById(outputId);
  const btn = document.getElementById(btnId);
  if (loading) {
    out.style.display = 'block';
    out.querySelector('[id$="Inner"]').innerHTML =
      `<div class="output-body loading"><div class="spinner"></div>${msg}</div>`;
    if (btn) btn.disabled = true;
  } else {
    if (btn) btn.disabled = false;
  }
}

function copyOutput(id) {
  const el = document.getElementById(id);
  const text = el.innerText;
  navigator.clipboard.writeText(text).then(() => showToast('Copiado!', 'success'));
}

function toggleTheme() {
  const body = document.body;
  const isDark = body.dataset.theme === 'dark';
  body.dataset.theme = isDark ? 'light' : 'dark';
  document.getElementById('themeIcon').className = isDark ? 'ti ti-moon' : 'ti ti-sun';
  document.getElementById('themeLabel').textContent = isDark ? 'Modo escuro' : 'Modo claro';
}

function updateStats() {
  localStorage.setItem('elixir_stats', JSON.stringify(stats));
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<span>${val}</span>`;
  };
  set('kpi-tasks', stats.tasks);
  set('kpi-pr',    stats.pr);
  set('kpi-sup',   stats.sup);
  set('kpi-feat',  stats.feat);
}

function ctSleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function ctEscapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
