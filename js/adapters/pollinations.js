// adapters/pollinations.js — free, client-side URL generation
async function generateWithPollinations(prompt, aspectRatio) {
  console.log('[pollinations] generateWithPollinations called, prompt:', prompt);

  const sizeMap = {
    '1:1':  { width: 1024, height: 1024 },
    '16:9': { width: 1344, height: 768 },
    '9:16': { width: 768,  height: 1344 },
    '4:3':  { width: 1152, height: 896 },
    '3:4':  { width: 896,  height: 1152 }
  };
  const size = sizeMap[aspectRatio] || sizeMap['1:1'];
  const encodedPrompt = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 999999);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${size.width}&height=${size.height}&seed=${seed}&nologo=true`;

  console.log('[pollinations] URL:', url);
  // [DEBUG] return URL ตรงๆ ไม่ preload เพราะติด CORS
  return url;
}