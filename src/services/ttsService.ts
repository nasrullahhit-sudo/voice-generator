import { VoicePersona } from '../types.ts';

// In-memory cache for generated base64 audio clips: key = `${voiceName}-${hash(text)}`
const audioCache: Map<string, { base64: string; blobUrl: string; duration: number }> = new Map();

function getCacheKey(text: string, voiceName: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return `${voiceName}-${hash}`;
}

export function base64ToBlobUrl(base64: string, mimeType = 'audio/wav'): string {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

export async function measureAudioDuration(blobUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.src = blobUrl;
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration || 10);
    });
    audio.addEventListener('error', () => {
      resolve(10);
    });
  });
}

export async function generateSpeech({
  text,
  voiceName = 'Fenrir',
  style,
}: {
  text: string;
  voiceName?: VoicePersona;
  style?: string;
}): Promise<{ base64: string; blobUrl: string; duration: number }> {
  const cacheKey = getCacheKey(text, voiceName);
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)!;
  }

  const response = await fetch('/api/tts/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      voiceName,
      style: style || 'Solemn, cinematic, respectful, deep Bengali documentary narrator with dignified cadence',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `TTS generation failed with HTTP status ${response.status}`);
  }

  const data = await response.json();
  if (!data.audioBase64) {
    throw new Error('Server returned empty audio data from gemini-3.8-flash-tts');
  }

  const blobUrl = base64ToBlobUrl(data.audioBase64, data.mimeType || 'audio/wav');
  const duration = await measureAudioDuration(blobUrl);

  const result = {
    base64: data.audioBase64,
    blobUrl,
    duration,
  };

  audioCache.set(cacheKey, result);
  return result;
}

export function downloadWav(base64: string, filename: string) {
  const blobUrl = base64ToBlobUrl(base64);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename.endsWith('.wav') ? filename : `${filename}.wav`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
}
