/**
 * Procedural Cinematic Ambient Soundscape Engine
 * Synthesizes a warm, mysterious, atmospheric drone and subtle wind harmonics
 * using the Web Audio API without requiring external audio files.
 */

class AmbientSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private noiseNode: AudioNode | null = null;
  private isRunning: boolean = false;
  private volume: number = 0.35;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public start() {
    if (this.isRunning) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Master output gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0001, now);
      this.masterGain.gain.exponentialRampToValueAtTime(Math.max(this.volume, 0.001), now + 2.5);
      this.masterGain.connect(this.ctx.destination);

      // 1. Deep Sub Root Drone (55 Hz - A1)
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(55, now);
      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.3, now);
      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start(now);
      this.oscillators.push(subOsc);

      // 2. Fifth Harmonic Drone (82.4 Hz - E2, slightly detuned)
      const fifthOsc = this.ctx.createOscillator();
      fifthOsc.type = 'triangle';
      fifthOsc.frequency.setValueAtTime(82.4, now);
      fifthOsc.detune.setValueAtTime(4, now);
      const fifthFilter = this.ctx.createBiquadFilter();
      fifthFilter.type = 'lowpass';
      fifthFilter.frequency.setValueAtTime(280, now);
      const fifthGain = this.ctx.createGain();
      fifthGain.gain.setValueAtTime(0.2, now);
      fifthOsc.connect(fifthFilter);
      fifthFilter.connect(fifthGain);
      fifthGain.connect(this.masterGain);
      fifthOsc.start(now);
      this.oscillators.push(fifthOsc);

      // 3. Ethereal Pad Chord (220 Hz - A3 with gentle chorus LFO)
      const padOsc = this.ctx.createOscillator();
      padOsc.type = 'sine';
      padOsc.frequency.setValueAtTime(220, now);
      const padLfo = this.ctx.createOscillator();
      padLfo.frequency.setValueAtTime(0.15, now);
      const padLfoGain = this.ctx.createGain();
      padLfoGain.gain.setValueAtTime(3.5, now);
      padLfo.connect(padOsc.detune);
      padLfo.start(now);
      this.oscillators.push(padLfo);

      const padFilter = this.ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.setValueAtTime(450, now);
      const padGain = this.ctx.createGain();
      padGain.gain.setValueAtTime(0.12, now);
      padOsc.connect(padFilter);
      padFilter.connect(padGain);
      padGain.connect(this.masterGain);
      padOsc.start(now);
      this.oscillators.push(padOsc);

      // 4. Atmospheric Wind & Breath Texture (Buffer Noise + Bandpass)
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02; // Pink-like filter
        lastOut = output[i];
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(320, now);
      noiseFilter.Q.setValueAtTime(1.2, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, now);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      whiteNoise.start(now);
      this.noiseNode = whiteNoise;

      this.isRunning = true;
    } catch (err) {
      console.warn('Failed to start ambient audio:', err);
    }
  }

  public stop() {
    if (!this.isRunning || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 1.2);
      setTimeout(() => {
        this.oscillators.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch (_) {}
        });
        this.oscillators = [];
        if (this.noiseNode) {
          try {
            (this.noiseNode as any).stop?.();
            this.noiseNode.disconnect();
          } catch (_) {}
          this.noiseNode = null;
        }
        this.isRunning = false;
      }, 1300);
    } catch (err) {
      this.isRunning = false;
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.ctx && this.masterGain && this.isRunning) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.1);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsPlaying(): boolean {
    return this.isRunning;
  }
}

export const ambientSound = new AmbientSoundscapeEngine();
