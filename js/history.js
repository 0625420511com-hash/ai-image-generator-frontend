// history.js — load and save image history from Supabase
console.log('[history] history.js loaded');

async function saveHistory({ prompt, model, aspectRatio, imageUrl, isExternal }) {
  console.log('[history] saveHistory called, model:', model, '| aspectRatio:', aspectRatio, '| isExternal:', isExternal);
  try {
    const session = await checkSession();
    if (!session) {
      console.warn('[history] saveHistory skipped — not authenticated');
      return;
    }

    const payload = {
      user_id: session.user.id,
      prompt,
      model,
      aspect_ratio: aspectRatio,
      image_url: imageUrl || null,
      is_external: isExternal || false
    };
    console.log('[history] inserting payload:', JSON.stringify(payload));

    const { error } = await _supabase
      .from('image_history')
      .insert(payload);

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
    if (!session) {
      console.warn('[history] loadHistory skipped — not authenticated');
      return [];
    }

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

// [FIX] เพิ่ม refreshHistory() ที่ index.html เรียกหา แต่ไม่มีใน history.js เดิม
async function refreshHistory() {
  console.log('[history] refreshHistory called');
  const items = await loadHistory();
  renderHistory(items);
}

async function deleteHistory(id) {
  console.log('[history] deleteHistory id:', id);
  try {
    const { error } = await _supabase
      .from('image_history')
      .delete()
      .eq('id', id);
    if (error) throw error;
    console.log('[history] deleted id:', id);
    await refreshHistory(); // refresh UI หลัง delete
  } catch (err) {
    console.error('[history] deleteHistory error:', err.message);
  }
}

function renderHistory(items) {
  console.log('[history] renderHistory items count:', items ? items.length : 0);
  const grid = document.getElementById('history-grid');
  if (!grid) {
    console.warn('[history] renderHistory — #history-grid not found in DOM');
    return;
  }

  if (!items || items.length === 0) {
    grid.innerHTML = '<p class="empty-history">ยังไม่มีประวัติการสร้างรูป</p>';
    return;
  }

  grid.innerHTML = items.map(item => {
    if (item.is_external || item.model === 'seaart') {
      const safePrompt = item.prompt.replace(/'/g, "\\'").replace(/"/g, '&quot;');
      return `
        <div class="history-card" onclick="reopenSeaArt('${safePrompt}')">
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
    const safePrompt = item.prompt.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    return `
      <div class="history-card" onclick="previewHistoryImage('${item.image_url}', '${safePrompt}')">
        <img src="${item.image_url}" alt="${item.prompt}" loading="lazy"
          onerror="this.style.display='none'; console.warn('[history] img load failed:', '${item.image_url}')" />
        <div class="history-card-info">
          <div class="history-card-model">${item.model}</div>
          <div class="history-card-prompt">${item.prompt}</div>
        </div>
      </div>
    `;
  }).join('');

  console.log('[history] renderHistory done');
}

function previewHistoryImage(url, prompt) {
  console.log('[history] previewHistoryImage url:', url);
  const img = document.getElementById('result-img');
  const placeholder = document.getElementById('image-placeholder');
  const actions = document.getElementById('image-actions');
  if (!img) {
    console.warn('[history] previewHistoryImage — #result-img not found');
    return;
  }
  img.src = url;
  img.style.display = 'block';
  if (placeholder) placeholder.style.display = 'none';
  if (actions) actions.style.display = 'flex';
  console.log('[history] previewHistoryImage done');
}

async function reopenSeaArt(prompt) {
  console.log('[history] reopenSeaArt prompt:', prompt);
  try {
    await navigator.clipboard.writeText(prompt);
    window.open('https://www.seaart.ai/aiart/generate', '_blank');
    showToast('คัดลอก prompt แล้ว เปิด SeaArt', 'info');
    console.log('[history] reopenSeaArt done');
  } catch (err) {
    console.error('[history] reopenSeaArt error:', err.message);
    showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
  }
}