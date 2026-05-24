// generate.js — main generation logic (guest mode, no auth, no history)
console.log('[generate] generate.js loaded');

const BACKEND_URL = 'https://ai-image-generator-backend-ashen.vercel.app';
window.BACKEND_URL = BACKEND_URL;
console.log('[generate] BACKEND_URL:', BACKEND_URL);

async function handleGenerate() {
  console.log('[generate] handleGenerate called');
  const prompt = document.getElementById('prompt').value.trim();
  const model = document.getElementById('model-select').value;
  const aspectRatio = document.getElementById('aspect-ratio').value;

  console.log('[generate] model:', model, '| aspectRatio:', aspectRatio);

  if (!prompt) {
    showToast('กรุณาใส่ prompt ก่อน', 'error');
    return;
  }

  setLoading(true);

  try {
    let imageUrl = null;

    if (model === 'gemini') {
      imageUrl = await generateWithGemini(prompt, aspectRatio);
    } else if (model === 'pollinations') {
      imageUrl = await generateWithPollinations(prompt, aspectRatio);
    } else if (model === 'stable-diffusion') {
      imageUrl = await generateWithStableDiffusion(prompt, aspectRatio);
    } else if (model === 'seaart') {
      await generateWithSeaArt(prompt);
      showToast('คัดลอก prompt แล้ว เปิด SeaArt แล้ว', 'info');
      setLoading(false);
      return;
    }

    if (imageUrl) {
      showImage(imageUrl);
      showToast('สร้างรูปสำเร็จ!', 'success');
      console.log('[generate] done');
    }

  } catch (err) {
    console.error('[generate] error:', err.message);
    showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
  } finally {
    setLoading(false);
  }
}

function showImage(url) {
  const img = document.getElementById('result-img');
  const placeholder = document.getElementById('image-placeholder');
  const actions = document.getElementById('image-actions');

  img.src = url;
  img.style.display = 'block';
  if (placeholder) placeholder.style.display = 'none';
  if (actions) actions.style.display = 'flex';
  console.log('[generate] showImage success');
}

function setLoading(state) {
  const btn = document.getElementById('generate-btn');
  const spinner = document.getElementById('spinner');
  const btnText = document.getElementById('btn-text');

  btn.disabled = state;
  if (spinner) spinner.style.display = state ? 'block' : 'none';
  if (btnText) btnText.textContent = state ? 'กำลังสร้าง...' : '✦ สร้างรูป';
}

async function handleDownload() {
  const img = document.getElementById('result-img');
  if (!img || !img.src || img.style.display === 'none') {
    showToast('ยังไม่มีรูปให้ดาวน์โหลด', 'error');
    return;
  }

  console.log('[generate] handleDownload called, src:', img.src);
  try {
    const response = await fetch(img.src);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-image-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('ดาวน์โหลดแล้ว!', 'success');
    console.log('[generate] handleDownload success');
  } catch (err) {
    console.warn('[generate] fetch failed, fallback open tab:', err.message);
    window.open(img.src, '_blank');
  }
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => { toast.className = 'toast'; }, 3000);
}