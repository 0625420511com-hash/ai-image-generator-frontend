// adapters/seaart.js — client-side only, clipboard + deep link
async function generateWithSeaArt(prompt) {
  console.log('[seaart] generateWithSeaArt called, prompt:', prompt);
  try {
    // Copy prompt to clipboard
    await navigator.clipboard.writeText(prompt);
    console.log('[seaart] prompt copied to clipboard');

    // Open SeaArt in new tab
    window.open('https://www.seaart.ai/aiart/generate', '_blank');

    console.log('[seaart] opened seaart.ai');
    return null; // No image URL — external tool
  } catch (err) {
    console.error('[seaart] error:', err.message);
    throw err;
  }
}
