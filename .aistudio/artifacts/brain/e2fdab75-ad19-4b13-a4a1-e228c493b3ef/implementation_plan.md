# কাসাসুল আম্বিয়া (Qasasul Ambiya) — Cinematic Script & Voice Studio

A dedicated production studio and cinematic player for the prophetic history video series in Bengali, starting with **Episode 1: মানবজাতির সূচনা ও হযরত আদম (আ.)** (The Dawn of Mankind & Prophet Adam, peace be upon him). The application features synchronized text-to-speech voiceover powered by `gemini-3.8-flash-tts`, atmospheric cinematic ambient soundscapes, interactive visual scene cards, teleprompter narration view, audio export, and an AI generator for continuing the series (starting with Episode 2: হযরত ইদরিস আ.).

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The clarifying questions were skipped, confirming the recommended defaults:
> - **Primary Experience**: Cinematic script player with synced voiceover, scene visualizer, and script production tools.
> - **Voice & Audio Pipeline**: Expressive Bengali narration generated via the `gemini-3.8-flash-tts` model on the server, paired with a web audio ambient soundscape and scene-level synchronization.
> - **Series Continuity**: Pre-loaded with Episode 1 (Hazrat Adam A.) and Episode 2 (Hazrat Idris A.), plus an AI episode script writer powered by `gemini-3.8-flash` to generate further episodes in the same cinematic structure.

- **Confirmed Decision 1**: High-fidelity TTS voiceover using server-side `@google/genai` with `gemini-3.8-flash-tts` delivering complete WAV audio clips per scene and full episode continuous audio.
- **Confirmed Decision 2**: Ambient soundscape generator using Web Audio API synthesis (warm drone, wind, subtle sub-bass) with mute/volume controls, matching the prompt's "মৃদু ও রহস্যময় অ্যাম্বিয়েন্ট সুর".
- **Confirmed Decision 3**: Complete dual-mode view: **Cinematic Player Mode** (full-bleed visual scene background, animated subtitles, timeline scrubber, play/pause/skip) and **Studio Script Mode** (scene-by-scene timing breakdown, voiceover editor, teleprompter, audio regeneration, and script download).

---

## 1. Overview & Core Concept

- **What It Does**: Transforms Bengali video scripts into a cinematic multimedia preview. Creators and listeners can play through the 1-minute 20-second solemn narration with synchronized timestamps ([00:00-00:15], [00:15-00:35], [00:35-00:55], [00:55-01:10], [01:10-01:20]), generate lifelike voiceovers using `gemini-3.8-flash-tts`, blend atmospheric ambient audio, export WAV recordings and formatted scripts, and generate new episodes in the series.
- **Target Audience**: Islamic content creators, documentary producers, video editors, and listeners seeking solemn, educational retellings of the prophets' stories.
- **Key Value**: Eliminates the barrier between raw scriptwriting and audio-visual production by providing instant AI voiceover generation, timing preview, and creative expansion tools in a single unified interface.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Cinematic Playback Flow**:
   - The user opens Episode 1. Clicking "Play Episode" starts the ambient soundscape and deep Bengali voiceover.
   - The scene cards transition smoothly through the 5 chronological acts: *The Hook & Dawn of Man*, *Creation & Knowledge*, *Trial & Descent to Earth*, *The Call to Tawhid & Civilization*, and *Outro to Prophet Idris (A.)*.
   - A timeline progress bar indicates current seconds and active scene with live Bengali subtitles displayed in high-contrast editorial typography.
2. **TTS Generation & Audio Studio**:
   - Users can trigger one-click TTS voice generation for individual scenes or the entire 80-second episode using `gemini-3.8-flash-tts`.
   - Voice style parameters can be toggled (solemn cinematic narrator, slower contemplative pace, dramatic cadence).
   - Audio can be listened to directly, scrubbed, or downloaded as `.wav`.
3. **Episode Navigator & AI Episode Creator**:
   - Episode switcher with Episode 1 (Hazrat Adam A.) and Episode 2 (Hazrat Idris A.).
   - "Generate Next Episode" modal where users can pick a prophet (e.g. Hazrat Nuh A., Hazrat Hud A., Hazrat Salih A., Hazrat Ibrahim A.) or enter a custom topic to generate a matching 1:20 cinematic script with hooks, scene descriptions, and voiceover text via `gemini-3.8-flash`.

### Visual Identity & Theme
- **Aesthetic Direction**: Solemn, contemplative, cinematic Islamic history documentary aesthetic. Dark nocturnal canvas inspired by ancient manuscripts, starlit desert skies, and deep gold accents.
- **Color Palette (60-30-10 Rule)**:
  - Canvas (60%): Deep obsidian and dark slate (`#090D16`, `#0D1117`).
  - Structural Surfaces (30%): Rich dark charcoal cards with subtle hairline gold/bronze borders (`#161B26`, `border-amber-900/30`, `border-slate-800`).
  - Accent Budget (10%): Warm luminous amber/gold (`#F59E0B`, `#D97706`, `#FDE68A`) for active play states, progress bars, and primary actions.
- **Typography**:
  - Headings & Episode Titles: Bold architectural sans `Outfit` paired with elegant Bengali type rendering (`Noto Sans Bengali` fallback stack).
  - Voiceover Script Prose: Highly readable serif / sans typography with balanced line heights (`leading-relaxed`, `text-lg`).
  - Metadata & Timers: Tabular figures (`tabular-nums font-mono text-xs text-amber-400/80`).
- **Interactive Feedback & Motion**:
  - Smooth audio waveform visualizer bars pulsing during active playback.
  - Scene fade transitions and subtle glow indicators on active timestamp markers.
  - Zero pill clutter: tags and scene metadata rendered as unboxed text with typographic separators (`00:15 – 00:35 · দৃশ্য ২ · সৃষ্টির রহস্য`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Server-Side TTS Integration via `gemini-3.8-flash-tts`**
  - *Chosen Approach*: An Express server endpoint `/api/tts/generate` accepts Bengali voiceover text and style instructions, invoking `@google/genai` with model `gemini-3.8-flash-tts` and returning standard WAV audio (`audio/wav`) to the browser.
  - *Why*: Complies with user instructions and security constraints (no client-side API keys; server handles model orchestration). `gemini-3.8-flash-tts` supports expressive emotional styles (solemn, reverent, documentary narration).
  - *Alternatives Considered*: Client-side speech synthesis API (unnatural robotic voices, inconsistent Bengali pronunciation across OS).
- **Decision 2: Web Audio API Cinematic Ambient Soundscape**
  - *Chosen Approach*: Built-in procedural ambient drone and harmonic chord generator using Web Audio API oscillators, biquad lowpass filters, and gentle pink noise (representing desert wind and dawn atmosphere), layered under the voiceover.
  - *Why*: Instant, lightweight, royalty-free audio that requires no large external asset downloads and can be smoothly crossfaded with the narration.
  - *Alternatives Considered*: Bundled static MP3 file (risk of network latency, fixed loop duration).
- **Decision 3: Full-Stack Express + Vite Architecture**
  - *Chosen Approach*: `server.ts` handles `/api/tts/generate` and `/api/episodes/generate`, while serving Vite React frontend in development and production.
  - *Why*: Allows secure server-side Gemini SDK execution with `process.env.GEMINI_API_KEY`.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                       Client (React)                        │
├─────────────────────────────────────────────────────────────┤
│  Top Navigation (Brand wordmark, Episodes, View Mode, Export)│
│                                                             │
│  ┌─────────────────────────┐  ┌───────────────────────────┐ │
│  │   Cinematic Player      │  │   Script Studio & Cards   │ │
│  │  - Active Scene Visual  │  │  - Timestamps & Cues      │ │
│  │  - Subtitle Overlay     │  │  - Voiceover Bengali Text │ │
│  │  - Waveform Visualizer  │  │  - Per-scene TTS control  │ │
│  │  - Audio Timeline Bar   │  │  - Teleprompter Mode      │ │
│  └───────────┬─────────────┘  └─────────────┬─────────────┘ │
│              │                              │               │
│              ▼                              ▼               │
│     Web Audio Ambient Synth         Audio Engine Player     │
│    (Drone, Wind, Resonance)        (Synchronized WAV Clips) │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP POST
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 Express Backend (server.ts)                 │
├─────────────────────────────────────────────────────────────┤
│  /api/tts/generate       -> GoogleGenAI(gemini-3.8-flash-tts)│
│  /api/episodes/generate  -> GoogleGenAI(gemini-3.8-flash)   │
└─────────────────────────────────────────────────────────────┘
```

### Data Model & State
- **Episode Interface**:
  - `id`: string (e.g. `'adam-intro'`, `'idris-early'`)
  - `title`: string (`'মানবজাতির সূচনা ও হযরত আদম (আ.)'`)
  - `episodeNumber`: number (`1`)
  - `durationSeconds`: number (`80`)
  - `tone`: string (`'গভীর, ভাবগম্ভীর ও সিনেম্যাটিক'`)
  - `bgmDescription`: string
  - `scenes`: Array of `Scene`:
    - `id`: string
    - `startSec`: number
    - `endSec`: number
    - `timestampLabel`: string (e.g. `'00:00 – 00:15'`)
    - `title`: string (e.g. `'আকর্ষণীয় সূচনা (হুক)'`)
    - `visualPrompt`: string (visual direction for video editors)
    - `voiceoverText`: string (Bengali narration text)
    - `audioUrl` / `audioBase64`?: string (cached generated WAV)

### Key Sequences
1. **Playback Synchronization**:
   - `currentTime` tracks playback progress (0 to 80s).
   - Audio buffer sources play seamless scene segments; when timestamp crosses boundary, active scene updates, scrolling the transcript and highlighting the live cue.
2. **TTS Generation**:
   - Client sends `{ text: scene.voiceoverText, style: "solemn, respectful, deep documentary narrator" }`.
   - Server configures `responseModalities: ["AUDIO"]` with `gemini-3.8-flash-tts` prebuilt voice config (`Charon` or `Fenrir` for deep solemn male voice).
   - Server returns Base64 WAV data (`audio/wav`), cached on client for instant replay.
3. **Episode Generation**:
   - Client requests prompt for next prophet or continuation.
   - Server calls `gemini-3.8-flash` with structured schema returning title, tone, scenes with timestamps, visual directions, and Bengali voiceover.
