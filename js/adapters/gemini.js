// adapters/gemini.js — calls backend proxy (key hidden server-side)
// [DEBUG] ใช้ window.BACKEND_URL จาก generate.js แทนการประกาศซ้ำ (แก้บัค: Identifier already declared)
console.log('[gemini] adapter loaded | BACKEND_URL:', window.BACKEND_URL);

async function generateWithGemini(prompt, aspectRatio) {
  console.log('[gemini] generateWithGemini called, prompt:', prompt);
  try {
    const response = await fetch(`${window.BACKEND_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, model: 'gemini', aspectRatio })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Gemini generation failed');

    console.log('[gemini] success');
    return data.imageUrl;
  } catch (err) {
    console.error('[gemini] error:', err.message);
    throw err;
  }
}