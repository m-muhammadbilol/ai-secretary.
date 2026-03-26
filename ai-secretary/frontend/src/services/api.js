const BASE_URL = import.meta.env.VITE_API_URL || '';

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Server xatosi' }));
    throw new Error(err.detail || err.error || `HTTP ${res.status}`);
  }
  return res;
}

export async function sendAudioForSTT(audioBlob) {
  const form = new FormData();
  const extension =
    audioBlob.type === 'audio/wav'
      ? 'wav'
      : audioBlob.type.includes('ogg')
      ? 'ogg'
      : 'webm';
  form.append('audio', audioBlob, `audio.${extension}`);

  const res = await fetch(`${BASE_URL}/api/stt`, {
    method: 'POST',
    body: form,
  });
  await handleResponse(res);
  return res.json();
}

export async function sendToAssistant(transcript) {
  const res = await fetch(`${BASE_URL}/api/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  });
  await handleResponse(res);
  return res.json();
}

export async function sendForTTS(text) {
  const res = await fetch(`${BASE_URL}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  await handleResponse(res);
  const audioBuffer = await res.arrayBuffer();
  return audioBuffer;
}

export async function fetchTasks() {
  const res = await fetch(`${BASE_URL}/api/tasks`);
  await handleResponse(res);
  return res.json();
}

export async function completeTaskApi(id) {
  const res = await fetch(`${BASE_URL}/api/tasks/${id}/complete`, { method: 'PATCH' });
  await handleResponse(res);
  return res.json();
}

export async function deleteTaskApi(id) {
  const res = await fetch(`${BASE_URL}/api/tasks/${id}`, { method: 'DELETE' });
  await handleResponse(res);
  return res.json();
}

export async function fetchReminders() {
  const res = await fetch(`${BASE_URL}/api/reminders`);
  await handleResponse(res);
  return res.json();
}

export async function deactivateReminderApi(id) {
  const res = await fetch(`${BASE_URL}/api/reminders/${id}/deactivate`, { method: 'PATCH' });
  await handleResponse(res);
  return res.json();
}

export async function checkHealth() {
  const res = await fetch(`${BASE_URL}/api/health`);
  await handleResponse(res);
  return res.json();
}
