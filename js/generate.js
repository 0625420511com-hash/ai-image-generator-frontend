const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// [DEBUG] รายชื่อ origin ที่อนุญาต
const ALLOWED_ORIGINS = [
  'https://0625420511com-hash.github.io',
  process.env.FRONTEND_URL,
].filter(Boolean);

function setCors(req, res) {
  const origin = req.headers['origin'];
  console.log('[cors] request origin:', origin);
  console.log('[cors] allowed origins:', ALLOWED_ORIGINS);

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    console.log('[cors] ✅ origin allowed');
  } else {
    // fallback — อนุญาตทุก origin (ปิดได้ถ้าต้องการ lock down)
    res.setHeader('Access-Control-Allow-Origin', '*');
    console.log('[cors] ⚠️ origin not in list, fallback to *');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function verifyToken(req) {
  console.log('[generate] Verifying JWT token...');
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  const token = authHeader.split(' ')[1];
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Invalid token');
  console.log('[generate] Token verified, user:', user.id);
  return user;
}

async function generateGemini(prompt, aspectRatio) {
  console.log('[generate] model=gemini, prompt=', prompt);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
      })
    }
  );

  const data = await response.json();
  console.log('[generate] Gemini raw response status:', response.status);

  if (!response.ok) throw new Error(data.error?.message || 'Gemini API error');

  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(p => p.inlineData);
  if (!imagePart) throw new Error('No image returned from Gemini');

  const base64 = imagePart.inlineData.data;
  const mimeType = imagePart.inlineData.mimeType || 'image/png';
  console.log('[generate] Gemini success, mimeType:', mimeType);
  return `data:${mimeType};base64,${base64}`;
}

async function generateStableDiffusion(prompt, aspectRatio) {
  console.log('[generate] model=stable-diffusion, prompt=', prompt);
  const token = process.env.HUGGINGFACE_TOKEN;
  if (!token) throw new Error('Missing HUGGINGFACE_TOKEN');

  const sizeMap = {
    '1:1': { width: 1024, height: 1024 },
    '16:9': { width: 1344, height: 768 },
    '9:16': { width: 768, height: 1344 },
    '4:3': { width: 1152, height: 896 },
    '3:4': { width: 896, height: 1152 }
  };
  const size = sizeMap[aspectRatio] || sizeMap['1:1'];

  const response = await fetch(
    'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { width: size.width, height: size.height }
      })
    }
  );

  console.log('[generate] HuggingFace response status:', response.status);
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HuggingFace error: ${err}`);
  }

  const buffer = await response.buffer();
  const base64 = buffer.toString('base64');
  console.log('[generate] Stable Diffusion success');
  return `data:image/jpeg;base64,${base64}`;
}

module.exports = async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, model, aspectRatio } = req.body;

    console.log(`[generate] Request: model=${model}, aspectRatio=${aspectRatio}`);

    if (!prompt || !model) {
      return res.status(400).json({ error: 'Missing prompt or model' });
    }

    let imageUrl;

    if (model === 'gemini') {
      imageUrl = await generateGemini(prompt, aspectRatio);
    } else if (model === 'stable-diffusion') {
      imageUrl = await generateStableDiffusion(prompt, aspectRatio);
    } else {
      return res.status(400).json({ error: `Unsupported model: ${model}` });
    }

    console.log('[generate] success, returning image');
    return res.status(200).json({ imageUrl, model, prompt });

  } catch (err) {
    console.error('[generate] error=', err.message);
    return res.status(500).json({ error: err.message });
  }
};