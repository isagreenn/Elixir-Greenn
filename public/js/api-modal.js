// ────────────────────────────────────────────────────────
// Modal de configuração da API Key (Google Gemini)
// ────────────────────────────────────────────────────────
function openModal() {
  document.getElementById('apiModal').classList.add('open');
  document.getElementById('cancelModalBtn').style.display = apiKey ? 'inline-flex' : 'none';
  document.getElementById('apiKeyInput').value = apiKey;
}

function closeModal() {
  document.getElementById('apiModal').classList.remove('open');
}

function saveApiKey() {
  const k = document.getElementById('apiKeyInput').value.trim();
  if (!k.startsWith('AIza')) {
    showToast('Chave inválida. Deve começar com AIza', 'error');
    return;
  }
  apiKey = k;
  localStorage.setItem('elixir_api_key', k);
  updateApiStatus();
  closeModal();
  showToast('API Key salva com sucesso!', 'success');
}

function toggleKeyVisibility() {
  const inp = document.getElementById('apiKeyInput');
  const icon = document.getElementById('eyeIcon');
  if (inp.type === 'password') {
    inp.type = 'text';
    icon.className = 'ti ti-eye-off';
  } else {
    inp.type = 'password';
    icon.className = 'ti ti-eye';
  }
}

function updateApiStatus() {
  const dot = document.getElementById('apiDot');
  const txt = document.getElementById('apiStatusText');
  if (!dot || !txt) return;
  if (apiKey) {
    dot.className = 'api-dot connected';
    txt.textContent = 'API conectada · clique para editar';
  } else {
    dot.className = 'api-dot error';
    txt.textContent = 'API não configurada · clique aqui';
  }
}
