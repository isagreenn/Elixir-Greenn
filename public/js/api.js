// ────────────────────────────────────────────────────────
// Google Gemini — chamada principal de IA
// ────────────────────────────────────────────────────────
async function callAI(userMessage) {
  const key = window.GEMINI_API_KEY || apiKey;
  if (!key) {
    if (typeof openModal === 'function') openModal();
    throw new Error('API Key não configurada');
  }

  const models = [GEMINI_MODEL, ...(typeof GEMINI_FALLBACKS !== 'undefined' ? GEMINI_FALLBACKS : [])];
  const transientStatuses = new Set([429, 500, 502, 503, 504]);
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  let lastErr;
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    // 2 tentativas por modelo (1 inicial + 1 retry) com backoff curto.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await _geminiCall(model, key, userMessage);
        if (res.ok) return _parseGeminiResponse(await res.json());
        if (!transientStatuses.has(res.status)) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || `Erro ${res.status}`);
        }
        // transient → backoff
        lastErr = new Error(`Modelo ${model} indisponível (${res.status})`);
        await sleep(600 + attempt * 900);
      } catch (e) {
        lastErr = e;
        // Erro de rede também tenta de novo
        if (attempt === 0) await sleep(500);
        else break;
      }
    }
    // próximo modelo
  }
  throw new Error((lastErr && lastErr.message) || 'IA indisponível no momento. Tente novamente em alguns segundos.');
}

function _geminiCall(model, key, userMessage) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  return fetch(url, {
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
}

function _parseGeminiResponse(data) {
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

  const extras = Array.isArray(window._ctExtraInfo) ? window._ctExtraInfo : [];
  const extrasBlock = extras.length
    ? `\n\nInformações complementares:\n${extras.join('\n')}`
    : '';
  const origemLine = formInfo.origem ? `Origem do chamado: ${formInfo.origem}\n` : '';

  const description =
`Cliente afetado: ${formInfo.cliente}
${origemLine}
Descrição do problema:
${formInfo.descricao || ''}${extrasBlock}`;

  const contextoIds = (taskData.contextos || [])
    .map(label => CT_CONTEXTOS[label])
    .filter(Boolean);

  const observadoresIds = Array.isArray(window._ctObservadoresIds)
    ? window._ctObservadoresIds
    : [];

  const customFields = [];
  if (contextoIds.length) {
    customFields.push({ id: CT_CONTEXTO_FIELD_ID, value: contextoIds });
  }
  if (observadoresIds.length && typeof CT_OBSERVADORES_FIELD_ID !== 'undefined') {
    customFields.push({ id: CT_OBSERVADORES_FIELD_ID, value: observadoresIds });
  }
  if (formInfo.origem && typeof CT_ORIGEM_FIELD_ID !== 'undefined') {
    customFields.push({ id: CT_ORIGEM_FIELD_ID, value: formInfo.origem });
  }

  const body = {
    name: taskData.titulo || formInfo.titulo,
    description,
    priority: CT_PRIORITY_MAP[formInfo.prioridade] || 3,
    tags: ['bug', 'elixir-greenn'],
    custom_fields: customFields
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
