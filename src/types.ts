export interface Scene {
  id: string;
  startSec: number;
  endSec: number;
  timestampLabel: string;
  title: string;
  visualPrompt: string;
  imageUrl?: string;
  voiceoverText: string;
  audioBase64?: string;
  audioBlobUrl?: string;
  isGeneratingAudio?: boolean;
}

export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  prophetName: string;
  duration: string;
  durationSeconds: number;
  tone: string;
  bgmDescription: string;
  outroTeaser: string;
  scenes: Scene[];
  fullAudioBase64?: string;
  fullAudioBlobUrl?: string;
  isGeneratingFullAudio?: boolean;
}

export type ViewMode = 'full-audio' | 'player' | 'studio' | 'teleprompter';

export type VoicePersona = 'Fenrir' | 'Charon' | 'Kore' | 'Puck' | 'Zephyr';

export interface VoiceOption {
  id: VoicePersona;
  name: string;
  banglaLabel: string;
  description: string;
  gender: 'male' | 'female';
}
