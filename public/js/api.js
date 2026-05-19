// ────────────────────────────────────────────────────────
// Google Gemini — chamada principal de IA
// ────────────────────────────────────────────────────────
async function callAI(userMessage) {
  if (!apiKey) {
    openModal();
    throw new Error('API Key não configurada');
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
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
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
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

  const anexosBloco = files.length
    ? `\n\n**Anexos:**\n${Array.from(files).map(f => `- ${f.name}`).join('\n')}`
    : '';

  const description =
`**Cliente afetado:** ${formInfo.cliente}

**Descrição do problema:**
${taskData.descricao || formInfo.descricao || ''}${anexosBloco}`;

  const body = {
    name: taskData.titulo || formInfo.titulo,
    description,
    priority: CT_PRIORITY_MAP[formInfo.prioridade] || 3,
    tags: ['bug', 'elixir-greenn']
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
