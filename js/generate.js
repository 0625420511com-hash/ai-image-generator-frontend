// generate.js — main generation logic (index.html version — with history support)
console.log('[generate] generate.js loaded');

const BACKEND_URL = 'https://ai-image-generator-backend-ashen.vercel.app';
window.BACKEND_URL = BACKEND_URL;
console.log('[generate] BACKEND_URL:', BACKEND_URL);

// [FIX] handleModelChange ถูกเรียกจาก index.html แต่ไม่มีใน generate.js เดิม
function handleModelChange() {
  const model = document.getElementById('model-select').value;
  const aspectRatio = document.getElementById('aspect-ratio');
  const seaartNote = document.getElementById('seaart-note');
  console.log('[generate] handleModelChange model:', model);
  if (model === 'seaart') {
    if (aspectRatio) aspectRatio.disabled = true;
    if (seaartNote) seaartNote.style.display = 'block';
  } else {
    if (aspectRatio) aspectRatio.disabled = false;
    if (seaartNote) seaartNote.style.display = 'none';
  }
}

async function handleGenerate() {
  console.log('[generate] handleGenerate called');
  const prompt = document.getElementById('prompt').value.trim();
  const model = document.getElementById('model-select').value;
  const aspectRatio = document.getElementById('aspect-ratio').value;

  console.log('[generate] prompt:', prompt, '| model:', model, '| aspectRatio:', aspectRatio);

  if (!prompt) {
    showToast('กรุณาใส่ prompt ก่อน', 'error');
    console.warn('[generate] aborted — empty prompt');
    return;
  }

  setLoading(true);

  try {
    let imageUrl = null;

    if (model === 'gemini') {
      console.log('[generate] calling generateWithGemini...');
      imageUrl = await generateWithGemini(prompt, aspectRatio);
    } else if (model === 'pollinations') {
      console.log('[generate] calling generateWithPollinations...');
      imageUrl = await generateWithPollinations(prompt, aspectRatio);
    } else if (model === 'stable-diffusion') {
      console.log('[generate] calling generateWithStableDiffusion...');
      imageUrl = await generateWithStableDiffusion(prompt, aspectRatio);
    } else if (model === 'seaart') {
      console.log('[generate] calling generateWithSeaArt...');
      await generateWithSeaArt(prompt);
      showToast('คัดลอก prompt แล้ว เปิด SeaArt แล้ว', 'info');
      // บันทึก history สำหรับ SeaArt (external)
      if (typeof saveHistory === 'function') {
        await saveHistory({ prompt, model: 'seaart', aspectRatio, imageUrl: null, isExternal: true });
        await refreshHistory();
      }
      setLoading(false);
      return;
    } else {
      console.error('[generate] unknown model:', model);
      throw new Error('ไม่รู้จัก model: ' + model);
    }

    if (imageUrl) {
      console.log('[generate] imageUrl received, length:', imageUrl.length);
      showImage(imageUrl, aspectRatio);
      showToast('สร้างรูปสำเร็จ!', 'success');

      // บันทึก history
      if (typeof saveHistory === 'function') {
        console.log('[generate] saving history...');
        await saveHistory({ prompt, model, aspectRatio, imageUrl, isExternal: false });
        await refreshHistory();
      } else {
        console.warn('[generate] saveHistory not available (login page mode)');
      }
      console.log('[generate] done');
    } else {
      console.warn('[generate] imageUrl is null/empty after generation');
      showToast('ไม่ได้รับรูปภาพจาก API', 'error');
    }

  } catch (err) {
    console.error('[generate] error:', err.message, err);
    showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
  } finally {
    setLoading(false);
  }
}

// [FIX] รับ aspectRatio เพื่อตั้ง CSS aspect-ratio ให้ตรงกับที่เลือก
function showImage(url, aspectRatio) {
  console.log('[generate] showImage url length:', url.length, '| aspectRatio:', aspectRatio);
  const img = document.getElementById('result-img');
  const placeholder = document.getElementById('image-placeholder');
  const actions = document.getElementById('image-actions');
  const preview = document.querySelector('.image-preview');

  if (!img) {
    console.error('[generate] showImage — #result-img not found');
    return;
  }

  // [FIX] ตั้ง aspect-ratio CSS ให้ container ตามที่เลือก
  const ratioMap = {
    '1:1':  '1 / 1',
    '16:9': '16 / 9',
    '9:16': '9 / 16',
    '4:3':  '4 / 3',
    '3:4':  '3 / 4'
  };
  if (preview && aspectRatio && ratioMap[aspectRatio]) {
    preview.style.aspectRatio = ratioMap[aspectRatio];
    preview.style.minHeight = 'unset';
    console.log('[generate] set preview aspect-ratio:', ratioMap[aspectRatio]);
  }

  img.src = url;
  img.style.display = 'block';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'contain';

  if (placeholder) placeholder.style.display = 'none';
  if (actions) actions.style.display = 'flex';
  console.log('[generate] showImage done');
}

function setLoading(state) {
  console.log('[generate] setLoading:', state);
  const btn = document.getElementById('generate-btn');
  const spinner = document.getElementById('spinner');
  const btnText = document.getElementById('btn-text');
  const overlay = document.getElementById('loading-overlay');

  if (!btn) {
    console.warn('[generate] setLoading — #generate-btn not found');
    return;
  }
  btn.disabled = state;
  if (spinner) spinner.style.display = state ? 'block' : 'none';
  if (btnText) btnText.textContent = state ? 'กำลังสร้าง...' : '✦ สร้างรูป';

  // Loading overlay
  if (overlay) {
    overlay.classList.toggle('active', state);
    console.log('[generate] loading-overlay:', state ? 'shown' : 'hidden');
  }
}

async function handleDownload() {
  const img = document.getElementById('result-img');
  if (!img || !img.src || img.style.display === 'none') {
    showToast('ยังไม่มีรูปให้ดาวน์โหลด', 'error');
    console.warn('[generate] handleDownload — no image to download');
    return;
  }

  console.log('[generate] handleDownload called, src length:', img.src.length);

  // ถ้าเป็น data URL (base64) ดาวน์โหลดตรงๆ
  if (img.src.startsWith('data:')) {
    console.log('[generate] handleDownload — data URL, direct download');
    const a = document.createElement('a');
    a.href = img.src;
    a.download = `ai-image-${Date.now()}.png`;
    a.click();
    showToast('ดาวน์โหลดแล้ว!', 'success');
    return;
  }

  try {
    const response = await fetch(img.src);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
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
  if (!toast) {
    console.warn('[generate] showToast — #toast not found');
    return;
  }
  console.log('[generate] showToast:', type, message);
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => { toast.className = 'toast'; }, 3000);
}