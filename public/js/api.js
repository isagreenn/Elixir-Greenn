// ────────────────────────────────────────────────────────
// Google Gemini — chamada principal de IA
// ────────────────────────────────────────────────────────
async function callAI(userMessage) {
  const key = window.GEMINI_API_KEY || apiKey;
  if (!key) {
    if (typeof openModal === 'function') openModal();
    throw new Error('API Key não configurada');
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json'
      }
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro ${res.status}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const finishReason = data.candidates?.[0]?.finishReason;
  const clean = text.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch (parseErr) {
    if (finishReason && finishReason !== 'STOP') {
      throw new Error(`IA cortou a resposta (${finishReason}). Tente novamente ou reduza o texto do report.`);
    }
    const repaired = repairTruncatedJson(clean);
    if (repaired) {
      try { return JSON.parse(repaired); } catch (_) { /* fall through */ }
    }
    console.error('JSON malformado da IA:', clean);
    throw new Error(`Resposta da IA inválida. ${parseErr.message}`);
  }
}

// Tenta consertar JSON truncado fechando string + estruturas pendentes.
function repairTruncatedJson(s) {
  if (!s) return null;
  let inString = false, escape = false;
  const stack = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === '{') stack.push('}');
    else if (c === '[') stack.push(']');
    else if (c === '}' || c === ']') stack.pop();
  }
  let fixed = s.replace(/,\s*$/, '');
  if (inString) fixed += '"';
  while (stack.length) fixed += stack.pop();
  return fixed;
}

// ────────────────────────────────────────────────────────
// ClickUp — criar task + upload de anexos
// ────────────────────────────────────────────────────────
async function ctCriarTaskClickUp(taskData, formInfo, files) {
  const token  = window.CLICKUP_TOKEN;
  const listId = window.CLICKUP_LIST_ID;
  if (!token || !listId) {
    throw new Error('ClickUp não configurado. Defina VITE_CLICKUP_TOKEN e VITE_CLICKUP_LIST_ID no arquivo .env.');
  }

  const description =
`Cliente afetado: ${formInfo.cliente}

Descrição do problema:
${formInfo.descricao || ''}`;

  const contextoIds = (taskData.contextos || [])
    .map(label => CT_CONTEXTOS[label])
    .filter(Boolean);

  const body = {
    name: taskData.titulo || formInfo.titulo,
    description,
    priority: CT_PRIORITY_MAP[formInfo.prioridade] || 3,
    tags: ['bug', 'elixir-greenn'],
    custom_fields: contextoIds.length
      ? [{ id: CT_CONTEXTO_FIELD_ID, value: contextoIds }]
      : []
  };

  const res = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
    method: 'POST',
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.err || `ClickUp ${res.status}`);
  }
  const task = await res.json();

  if (files && files.length) {
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('attachment', file);
      try {
        await fetch(`https://api.clickup.com/api/v2/task/${task.id}/attachment`, {
          method: 'POST',
          headers: { 'Authorization': token },
          body: fd
        });
      } catch (_) { /* falhas individuais de upload são silenciosas */ }
    }
  }

  return { id: task.id, url: task.url || `https://app.clickup.com/t/${task.id}` };
}
