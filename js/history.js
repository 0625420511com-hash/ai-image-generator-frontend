// history.js — load and save image history from Supabase
console.log('[history] history.js loaded');

async function saveHistory({ prompt, model, aspectRatio, imageUrl, isExternal }) {
  console.log('[history] saveHistory called, model:', model);
  try {
    const session = await checkSession();
    if (!session) throw new Error('Not authenticated');

    const { error } = await _supabase
      .from('image_history')
      .insert({
        user_id: session.user.id,
        prompt,
        model,
        aspect_ratio: aspectRatio,
        image_url: imageUrl || null,
        is_external: isExternal || false
      });

    if (error) throw error;
    console.log('[history] saveHistory success');
  } catch (err) {
    console.error('[history] saveHistory error:', err.message);
  }
}

async function loadHistory() {
  console.log('[history] loadHistory called');
  try {
    const session = await checkSession();
    if (!session) return [];

    const { data, error } = await _supabase
      .from('image_history')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    console.log('[history] loaded', data.length, 'items');
    return data;
  } catch (err) {
    console.error('[history] loadHistory error:', err.message);
    return [];
  }
}

async function deleteHistory(id) {
  console.log('[history] deleteHistory id:', id);
  try {
    const { error } = await _supabase
      .from('image_history')
      .delete()
      .eq('id', id);
    if (error) throw error;
    console.log('[history] deleted');
  } catch (err) {
    console.error('[history] deleteHistory error:', err.message);
  }
}

function renderHistory(items) {
  const grid = document.getElementById('history-grid');
  if (!grid) return;

  if (!items || items.length === 0) {
    grid.innerHTML = '<p class="empty-history">ยังไม่มีประวัติการสร้างรูป</p>';
    return;
  }

  grid.innerHTML = items.map(item => {
    if (item.is_external || item.model === 'seaart') {
      return `
        <div class="history-card" onclick="reopenSeaArt('${item.prompt.replace(/'/g, "\\'")}')">
          <div class="seaart-placeholder">
            <span style="font-size:1.5rem">🎨</span>
            <span>SeaArt</span>
            <span style="font-size:0.65rem">คลิกเพื่อเปิดอีกครั้ง</span>
          </div>
          <div class="history-card-info">
            <div class="history-card-model">SeaArt <span class="badge badge-external">External</span></div>
            <div class="history-card-prompt">${item.prompt}</div>
          </div>
        </div>
      `;
    }
    return `
      <div class="history-card" onclick="previewHistoryImage('${item.image_url}', '${item.prompt.replace(/'/g, "\\'")}')">
        <img src="${item.image_url}" alt="${item.prompt}" loading="lazy" />
        <div class="history-card-info">
          <div class="history-card-model">${item.model}</div>
          <div class="history-card-prompt">${item.prompt}</div>
        </div>
      </div>
    `;
  }).join('');
}

function previewHistoryImage(url, prompt) {
  const img = document.getElementById('result-img');
  const placeholder = document.getElementById('image-placeholder');
  const actions = document.getElementById('image-actions');
  if (img) {
    img.src = url;
    img.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
    if (actions) actions.style.display = 'flex';
  }
}

async function reopenSeaArt(prompt) {
  try {
    await navigator.clipboard.writeText(prompt);
    window.open('https://www.seaart.ai/aiart/generate', '_blank');
    showToast('คัดลอก prompt แล้ว เปิด SeaArt', 'info');
  } catch (err) {
    console.error('[history] reopenSeaArt error:', err.message);
  }
}
