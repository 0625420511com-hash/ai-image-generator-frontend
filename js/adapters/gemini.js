// adapters/gemini.js — calls backend proxy (key hidden server-side)
console.log('[gemini] adapter loaded | BACKEND_URL:', window.BACKEND_URL);

async function generateWithGemini(prompt, aspectRatio) {
  console.log('[gemini] generateWithGemini: prompt length=', prompt.length, '| aspectRatio=', aspectRatio);

  // [FIX Bug#1] ดึง JWT token จาก getToken() ใน auth.js แล้วส่งไปกับ request
  let token = null;
  if (typeof getToken === 'function') {
    token = await getToken();
    console.log('[gemini] token fetched:', token ? 'OK (length=' + token.length + ')' : 'NULL — user not logged in');
  } else {
    console.warn('[gemini] getToken not available — auth.js not loaded?');
  }

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${window.BACKEND_URL}/api/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt, model: 'gemini', aspectRatio })
    });

    console.log('[gemini] response.status=', response.status);
    const data = await response.json();

    if (!response.ok) {
      console.error('[gemini] backend error —', data.error);
      throw new Error(data.error || 'Gemini generation failed');
    }

    console.log('[gemini] success, imageUrl type=', data.imageUrl?.startsWith('data:') ? 'base64' : 'url');
    return data.imageUrl;
  } catch (err) {
    console.error('[gemini] error:', err.message);
    throw err;
  }
}