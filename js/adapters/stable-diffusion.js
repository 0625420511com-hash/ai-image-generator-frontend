// adapters/stable-diffusion.js — calls backend proxy (token hidden server-side)
console.log('[stable-diffusion] adapter loaded | BACKEND_URL:', window.BACKEND_URL);

async function generateWithStableDiffusion(prompt, aspectRatio) {
  console.log('[stable-diffusion] generateWithStableDiffusion: prompt length=', prompt.length, '| aspectRatio=', aspectRatio);

  // [FIX Bug#1] ดึง JWT token จาก getToken() ใน auth.js แล้วส่งไปกับ request
  let token = null;
  if (typeof getToken === 'function') {
    token = await getToken();
    console.log('[stable-diffusion] token fetched:', token ? 'OK (length=' + token.length + ')' : 'NULL — user not logged in');
  } else {
    console.warn('[stable-diffusion] getToken not available — auth.js not loaded?');
  }

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${window.BACKEND_URL}/api/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt, model: 'stable-diffusion', aspectRatio })
    });

    console.log('[stable-diffusion] response.status=', response.status);
    const data = await response.json();

    if (!response.ok) {
      console.error('[stable-diffusion] backend error —', data.error);
      throw new Error(data.error || 'Stable Diffusion generation failed');
    }

    console.log('[stable-diffusion] success, imageUrl type=', data.imageUrl?.startsWith('data:') ? 'base64' : 'url');
    return data.imageUrl;
  } catch (err) {
    console.error('[stable-diffusion] error:', err.message);
    throw err;
  }
}