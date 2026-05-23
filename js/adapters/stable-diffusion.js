// adapters/stable-diffusion.js — calls backend proxy (token hidden server-side)
async function generateWithStableDiffusion(prompt, aspectRatio) {
  console.log('[stable-diffusion] generateWithStableDiffusion called, prompt:', prompt);
  try {
    const response = await fetch(`${window.BACKEND_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, model: 'stable-diffusion', aspectRatio })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Stable Diffusion generation failed');

    console.log('[stable-diffusion] success');
    return data.imageUrl;
  } catch (err) {
    console.error('[stable-diffusion] error:', err.message);
    throw err;
  }
}
