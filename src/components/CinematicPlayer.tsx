import React, { useState, useEffect, useRef } from 'react';
import { Episode, Scene, VoicePersona } from '../types.ts';
import { AVAILABLE_VOICES } from '../data/episodes.ts';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Download,
  Sparkles,
  Maximize2,
  Minimize2,
  Loader2,
  Headphones,
} from 'lucide-react';
import { generateSpeech, downloadWav } from '../services/ttsService.ts';

interface CinematicPlayerProps {
  episode: Episode;
  activeSceneIndex: number;
  onSelectSceneIndex: (index: number) => void;
  isAmbientPlaying: boolean;
  onToggleAmbient: () => void;
  onUpdateEpisodeScene: (sceneId: string, updates: Partial<Scene>) => void;
}

export const CinematicPlayer: React.FC<CinematicPlayerProps> = ({
  episode,
  activeSceneIndex,
  onSelectSceneIndex,
  isAmbientPlaying,
  onToggleAmbient,
  onUpdateEpisodeScene,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [selectedVoice, setSelectedVoice] = useState<VoicePersona>('Fenrir');
  const [isGeneratingAll, setIsGeneratingAll] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeScene = episode.scenes[activeSceneIndex] || episode.scenes[0];

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audioElementRef.current = audio;

    const handleEnded = () => {
      // Advance to next scene if available
      if (activeSceneIndex < episode.scenes.length - 1) {
        onSelectSceneIndex(activeSceneIndex + 1);
      } else {
        setIsPlaying(false);
        setCurrentTimeSec(episode.durationSeconds);
      }
    };

    const handleTimeUpdate = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        const sceneDuration = activeScene.endSec - activeScene.startSec;
        const progressInScene = (audio.currentTime / audio.duration) * sceneDuration;
        const globalTime = Math.min(
          activeScene.startSec + progressInScene,
          activeScene.endSec
        );
        setCurrentTimeSec(Math.round(globalTime));
      }
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.pause();
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [activeSceneIndex, activeScene, episode.durationSeconds, episode.scenes.length, onSelectSceneIndex]);

  // When active scene changes, load its audio if ready
  useEffect(() => {
    if (!audioElementRef.current) return;
    const audio = audioElementRef.current;

    if (activeScene.audioBlobUrl) {
      audio.src = activeScene.audioBlobUrl;
      audio.currentTime = 0;
      if (isPlaying) {
        audio.play().catch((e) => console.warn('Audio play error:', e));
      }
    } else {
      audio.pause();
      audio.removeAttribute('src');
    }
  }, [activeScene.id, activeScene.audioBlobUrl]);

  // Handle Play/Pause
  const handleTogglePlay = async () => {
    setAudioError(null);
    if (isPlaying) {
      setIsPlaying(false);
      audioElementRef.current?.pause();
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      // Check if current scene has audio
      if (!activeScene.audioBlobUrl) {
        // Automatically generate TTS for this scene first!
        try {
          await handleGenerateSceneTTS(activeScene);
        } catch (err: any) {
          setAudioError(err.message || 'TTS generation failed');
          return;
        }
      }

      setIsPlaying(true);
      if (!isAmbientPlaying) {
        onToggleAmbient();
      }

      if (audioElementRef.current && activeScene.audioBlobUrl) {
        audioElementRef.current.play().catch((e) => {
          console.warn('Playback error:', e);
        });
      }
    }
  };

  // Generate TTS for a specific scene
  const handleGenerateSceneTTS = async (scene: Scene) => {
    setAudioError(null);
    onUpdateEpisodeScene(scene.id, { isGeneratingAudio: true });
    try {
      const res = await generateSpeech({
        text: scene.voiceoverText,
        voiceName: selectedVoice,
        style: 'Solemn, deeply respectful, slow-paced, cinematic Bengali documentary narrator',
      });

      onUpdateEpisodeScene(scene.id, {
        audioBase64: res.base64,
        audioBlobUrl: res.blobUrl,
        isGeneratingAudio: false,
      });

      if (scene.id === activeScene.id && audioElementRef.current) {
        audioElementRef.current.src = res.blobUrl;
        if (isPlaying) {
          audioElementRef.current.play().catch(() => {});
        }
      }
    } catch (err: any) {
      console.error('Failed to generate TTS:', err);
      onUpdateEpisodeScene(scene.id, { isGeneratingAudio: false });
      setAudioError(err?.message || 'ভয়েস তৈরিতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
      throw err;
    }
  };

  // Generate TTS for all scenes in episode
  const handleGenerateAllScenes = async () => {
    setIsGeneratingAll(true);
    setAudioError(null);
    try {
      for (const sc of episode.scenes) {
        if (!sc.audioBlobUrl) {
          await handleGenerateSceneTTS(sc);
        }
      }
    } catch (err: any) {
      setAudioError('কিছু সিনের অডিও তৈরিতে সমস্যা হয়েছে।');
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // Jump to specific timestamp
  const handleSeek = (targetSec: number) => {
    const clamped = Math.max(0, Math.min(episode.durationSeconds, targetSec));
    setCurrentTimeSec(clamped);

    // Find which scene contains this timestamp
    const foundIndex = episode.scenes.findIndex(
      (s) => clamped >= s.startSec && clamped <= s.endSec
    );

    if (foundIndex !== -1 && foundIndex !== activeSceneIndex) {
      onSelectSceneIndex(foundIndex);
    }
  };

  // Skip forward/back
  const handleSkip = (deltaSec: number) => {
    handleSeek(currentTimeSec + deltaSec);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5" ref={playerContainerRef}>
      
      {/* Cinematic Frame */}
      <div className="relative aspect-[16/9] w-full bg-[#050811] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-black/80 flex flex-col justify-between group">
        
        {/* Visual Scene Background with subtle slow pan animation */}
        <div className="absolute inset-0 z-0">
          {activeScene.imageUrl ? (
            <img
              src={activeScene.imageUrl}
              alt={activeScene.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-all duration-1000 ease-out transform scale-100 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-[#0B1120] to-amber-950/40 flex items-center justify-center">
              <span className="text-slate-500 font-light">ভিজ্যুয়াল প্রম্পট: {activeScene.title}</span>
            </div>
          )}

          {/* Measured Cinematic Scrims (Ensures 4.5:1 text contrast) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/30 pointer-events-none" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black/70 pointer-events-none" />
        </div>

        {/* Top Overlay: Episode Title & Scene Breadcrumb */}
        <div className="relative z-10 p-5 md:p-7 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-amber-400 font-medium">
              <span>পর্ব {episode.episodeNumber}</span>
              <span aria-hidden="true">·</span>
              <span>{episode.prophetName}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{activeScene.timestampLabel}</span>
            </div>
            <h2 className="text-lg md:text-2xl font-bold tracking-tight text-white mt-1 drop-shadow-md">
              {activeScene.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Ambient indicator */}
            <button
              onClick={onToggleAmbient}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md transition-colors ${
                isAmbientPlaying
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-black/40 text-slate-400 border border-slate-700/60 hover:text-white'
              }`}
            >
              {isAmbientPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">অ্যাম্বিয়েন্ট সুর</span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-black/40 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md transition-colors"
              title="ফুলস্ক্রিন"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Center: Live Waveform Visualizer & Play trigger on image */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
          {isPlaying && (
            <div className="flex items-center gap-1.5 mb-4">
              {[40, 65, 85, 50, 95, 70, 80, 45, 90, 60, 75, 50].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-amber-400/80 rounded-full animate-pulse transition-all duration-300"
                  style={{
                    height: `${Math.max(12, (h * Math.sin((currentTimeSec + i) * 1.5) + 100) / 3)}px`,
                    animationDelay: `${i * 90}ms`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Error Message if TTS fails */}
          {audioError && (
            <div className="bg-rose-950/80 border border-rose-800 text-rose-200 text-xs px-4 py-2 rounded-lg backdrop-blur-md max-w-md text-center shadow-lg">
              {audioError}
            </div>
          )}
        </div>

        {/* Bottom Overlay: Subtitles & Director Visual Cue */}
        <div className="relative z-10 p-5 md:p-8 space-y-4">
          
          {/* Bengali Voiceover Narration Subtitle */}
          <div className="max-w-4xl mx-auto text-center">
            <p className="font-script text-lg sm:text-xl md:text-2xl text-amber-100 font-medium leading-relaxed drop-shadow-lg transition-all duration-300">
              “{activeScene.voiceoverText}”
            </p>
            <div className="mt-2 text-xs md:text-sm text-slate-400 flex items-center justify-center gap-2">
              <span className="text-amber-400/80">ভিজ্যুয়াল নির্দেশনা:</span>
              <span className="italic">{activeScene.visualPrompt}</span>
            </div>
          </div>

        </div>

      </div>

      {/* Synchronized Multi-Scene Timeline Bar */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 space-y-3 shadow-lg">
        
        {/* Timeline Header */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">টাইমলাইন সেগমেন্ট:</span>
            <span>৫টি দৃশ্য বিভাজন</span>
          </div>
          <div className="font-mono tabular-nums text-amber-400 text-sm font-semibold">
            {formatTime(currentTimeSec)} <span className="text-slate-600">/</span> {formatTime(episode.durationSeconds)}
          </div>
        </div>

        {/* 5-Scene Interactive Timeline Segments */}
        <div className="grid grid-cols-5 gap-1.5 w-full">
          {episode.scenes.map((scene, idx) => {
            const isCurrent = idx === activeSceneIndex;
            const hasAudio = Boolean(scene.audioBlobUrl);
            const isPassed = currentTimeSec >= scene.endSec;

            return (
              <button
                key={scene.id}
                onClick={() => {
                  onSelectSceneIndex(idx);
                  setCurrentTimeSec(scene.startSec);
                  if (audioElementRef.current && scene.audioBlobUrl) {
                    audioElementRef.current.currentTime = 0;
                  }
                }}
                className={`group relative text-left p-2 rounded-lg border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-amber-500/15 border-amber-500/60 shadow-sm shadow-amber-500/10'
                    : isPassed
                    ? 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:border-slate-600'
                    : 'bg-slate-950/60 border-slate-800/60 text-slate-500 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className={`font-mono tabular-nums ${isCurrent ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}>
                    {scene.timestampLabel}
                  </span>
                  {hasAudio && (
                    <span title="অডিও তৈরি আছে">
                      <Headphones className="w-3 h-3 text-amber-400/80 shrink-0" />
                    </span>
                  )}
                </div>
                <div className={`text-xs font-medium truncate ${isCurrent ? 'text-slate-100 font-semibold' : 'text-slate-300'}`}>
                  {idx + 1}. {scene.title}
                </div>
                {/* Segment Progress Fill */}
                <div className="mt-1.5 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isCurrent
                        ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                        : isPassed
                        ? 'bg-slate-600'
                        : 'bg-transparent'
                    }`}
                    style={{
                      width: isCurrent
                        ? `${Math.min(
                            100,
                            Math.max(
                              0,
                              ((currentTimeSec - scene.startSec) / (scene.endSec - scene.startSec)) * 100
                            )
                          )}%`
                        : isPassed
                        ? '100%'
                        : '0%',
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Master Playback Controls Strip */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          
          {/* Left: Playback buttons */}
          <div className="flex items-center gap-2">
            {/* Prev scene */}
            <button
              onClick={() => {
                if (activeSceneIndex > 0) {
                  onSelectSceneIndex(activeSceneIndex - 1);
                }
              }}
              disabled={activeSceneIndex === 0}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-slate-800"
              title="পূর্ববর্তী দৃশ্য"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Rewind 5s */}
            <button
              onClick={() => handleSkip(-5)}
              className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
              title="৫ সেকেন্ড পেছনে যান"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Play / Pause Main CTA */}
            <button
              onClick={handleTogglePlay}
              disabled={activeScene.isGeneratingAudio}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {activeScene.isGeneratingAudio ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>ভয়েস তৈরি হচ্ছে...</span>
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-slate-950" />
                  <span>থামান</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{activeScene.audioBlobUrl ? 'প্লে করুন' : 'ভয়েস ও প্লে'}</span>
                </>
              )}
            </button>

            {/* Forward 5s */}
            <button
              onClick={() => handleSkip(5)}
              className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
              title="৫ সেকেন্ড সামনে যান"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Next scene */}
            <button
              onClick={() => {
                if (activeSceneIndex < episode.scenes.length - 1) {
                  onSelectSceneIndex(activeSceneIndex + 1);
                }
              }}
              disabled={activeSceneIndex === episode.scenes.length - 1}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-slate-800"
              title="পরবর্তী দৃশ্য"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Voice Persona Selection & Batch Generation */}
          <div className="flex items-center gap-3">
            
            {/* Voice Persona Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden md:inline">ভয়েস চরিত্র:</span>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value as VoicePersona)}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                {AVAILABLE_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} · {v.banglaLabel}
                  </option>
                ))}
              </select>
            </div>

            {/* Generate Single Scene Audio */}
            {!activeScene.audioBlobUrl && (
              <button
                onClick={() => handleGenerateSceneTTS(activeScene)}
                disabled={activeScene.isGeneratingAudio}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 rounded-lg transition-colors cursor-pointer"
                title="জেমিনাই 3.8 ফ্ল্যাশ TTS দিয়ে ভয়েস বানান"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>দৃশ্য ভয়েস তৈরি</span>
              </button>
            )}

            {/* Batch Generate All Audio */}
            <button
              onClick={handleGenerateAllScenes}
              disabled={isGeneratingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="পুরো পর্বের সব সিনের জন্য অডিও তৈরি করুন"
            >
              {isGeneratingAll ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Headphones className="w-3.5 h-3.5 text-amber-400" />
                  <span>সব সিন ভয়েস</span>
                </>
              )}
            </button>

            {/* Download Active Scene Audio */}
            {activeScene.audioBase64 && (
              <button
                onClick={() =>
                  downloadWav(
                    activeScene.audioBase64!,
                    `episode_${episode.episodeNumber}_scene_${activeSceneIndex + 1}_${activeScene.id}.wav`
                  )
                }
                className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="WAV অডিও ডাউনলোড করুন"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
