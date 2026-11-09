import React, { useState, useEffect, useRef } from 'react';
import { Episode, VoicePersona } from '../types.ts';
import { AVAILABLE_VOICES } from '../data/episodes.ts';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Download,
  Sparkles,
  Loader2,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Headphones,
  Sliders,
  FileAudio,
  RefreshCw,
  Music,
} from 'lucide-react';
import { generateSpeech, downloadWav } from '../services/ttsService.ts';

interface FullVoiceoverStudioProps {
  episode: Episode;
  isAmbientPlaying: boolean;
  onToggleAmbient: () => void;
  onUpdateEpisode: (updates: Partial<Episode>) => void;
}

export const FullVoiceoverStudio: React.FC<FullVoiceoverStudioProps> = ({
  episode,
  isAmbientPlaying,
  onToggleAmbient,
  onUpdateEpisode,
}) => {
  // Combine all scenes into one continuous script
  const defaultFullScript = episode.scenes.map((s) => s.voiceoverText.trim()).join('\n\n');

  const [scriptText, setScriptText] = useState<string>(defaultFullScript);
  const [selectedVoice, setSelectedVoice] = useState<VoicePersona>('Fenrir');
  const [styleTone, setStyleTone] = useState<string>('গভীর, ভাবগম্ভীর ও সিনেম্যাটিক');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(80);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Sync script text when active episode changes
  useEffect(() => {
    const combined = episode.scenes.map((s) => s.voiceoverText.trim()).join('\n\n');
    setScriptText(combined);
  }, [episode.id]);

  // Set up audio element
  useEffect(() => {
    const audio = new Audio();
    audioElementRef.current = audio;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setAudioDuration(Math.round(audio.duration));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTimeSec(Math.round(audio.currentTime));
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTimeSec(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Update audio source when episode has generated audio
  useEffect(() => {
    if (!audioElementRef.current) return;
    if (episode.fullAudioBlobUrl) {
      audioElementRef.current.src = episode.fullAudioBlobUrl;
      audioElementRef.current.playbackRate = playbackSpeed;
    }
  }, [episode.fullAudioBlobUrl]);

  // Update playback speed
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Generate the entire 1m 20s voiceover in one call
  const handleGenerateFullVoiceover = async () => {
    if (!scriptText.trim()) {
      setErrorMsg('দয়া করে ভয়েসওভার টেক্সট লিখুন বা নির্বাচন করুন।');
      return;
    }

    setErrorMsg(null);
    onUpdateEpisode({ isGeneratingFullAudio: true });

    try {
      const res = await generateSpeech({
        text: scriptText.trim(),
        voiceName: selectedVoice,
        style: `Solemn, deeply respectful, slow-paced cinematic Bengali narrator, ${styleTone}`,
      });

      onUpdateEpisode({
        fullAudioBase64: res.base64,
        fullAudioBlobUrl: res.blobUrl,
        isGeneratingFullAudio: false,
      });

      setAudioDuration(Math.round(res.duration || 80));

      if (audioElementRef.current) {
        audioElementRef.current.src = res.blobUrl;
        audioElementRef.current.currentTime = 0;
      }
    } catch (err: any) {
      console.error('Full TTS error:', err);
      onUpdateEpisode({ isGeneratingFullAudio: false });
      setErrorMsg(
        err?.message || 'সম্পূর্ণ ভয়েস তৈরিতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।'
      );
    }
  };

  // Play / Pause toggle
  const handleTogglePlay = () => {
    if (!audioElementRef.current) return;

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!episode.fullAudioBlobUrl) {
        handleGenerateFullVoiceover();
        return;
      }

      audioElementRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          console.warn('Playback failed:', e);
          setIsPlaying(false);
        });
    }
  };

  // Seek
  const handleSeek = (newSec: number) => {
    if (!audioElementRef.current) return;
    const clamped = Math.max(0, Math.min(audioDuration, newSec));
    audioElementRef.current.currentTime = clamped;
    setCurrentTimeSec(clamped);
  };

  // Skip 10s
  const handleSkip = (delta: number) => {
    handleSeek(currentTimeSec + delta);
  };

  // Copy full script
  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Reset to default
  const handleResetScript = () => {
    const combined = episode.scenes.map((s) => s.voiceoverText.trim()).join('\n\n');
    setScriptText(combined);
  };

  const wordCount = scriptText.split(/\s+/).filter(Boolean).length;
  const estimatedSeconds = Math.round(wordCount * 0.58);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      
      {/* Hero Studio Banner */}
      <div className="bg-gradient-to-b from-[#111726] to-[#0A0E17] border border-amber-900/30 rounded-2xl p-6 md:p-8 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-amber-400 font-medium">
              <FileAudio className="w-4 h-4" />
              <span>এক ক্লিকে ফুল ভয়েসওভার স্টুডিও</span>
              <span aria-hidden="true">·</span>
              <span>মডেল: gemini-3.8-flash-tts</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mt-1">
              একসাথে পুরো ১ মিনিট ২০ সেকেন্ডের অডিও তৈরি
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              আলাদা আলাদা দৃশ্য নয়, সম্পূর্ণ ভিডিওর ভয়েসওভার এক ক্লিকেই একটি মাত্র নির্বিঘ্ন হাই-কোয়ালিটি অডিও ফাইলে রূপান্তর ও ডাউনলোড করুন।
            </p>
          </div>

          {/* Quick Ambient BGM Toggle */}
          <button
            onClick={onToggleAmbient}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors self-start md:self-center shrink-0 cursor-pointer ${
              isAmbientPlaying
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {isAmbientPlaying ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
            <span>{isAmbientPlaying ? 'অ্যাম্বিয়েন্ট মিউজিক চালু' : 'অ্যাম্বিয়েন্ট মিউজিক যুক্ত করুন'}</span>
          </button>
        </div>

        {/* Audio Configuration Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-4 border-t border-slate-800/80 text-xs">
          
          {/* Voice Persona Dropdown */}
          <div className="space-y-1.5 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
            <label className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-amber-400" />
              <span>ভয়েসওভার কণ্ঠ চরিত্র (Voice):</span>
            </label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value as VoicePersona)}
              className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-medium rounded-lg p-2 focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              {AVAILABLE_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} · {v.banglaLabel}
                </option>
              ))}
            </select>
          </div>

          {/* Narration Style */}
          <div className="space-y-1.5 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
            <label className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>কথন শৈলী ও আবহ (Style):</span>
            </label>
            <select
              value={styleTone}
              onChange={(e) => setStyleTone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="গভীর, ভাবগম্ভীর ও সিনেম্যাটিক">গভীর, ভাবগম্ভীর ও সিনেম্যাটিক (ডকুমেন্টারি)</option>
              <option value="ধীর, আধ্যাত্মিক ও বিনম্র">ধীর, আধ্যাত্মিক ও বিনম্র সুর</option>
              <option value="মহিমান্বিত ও তেজস্বী ইতিহাস কথন">মহিমান্বিত ও তেজস্বী ইতিহাস কথন</option>
              <option value="শান্ত ও স্নিগ্ধ ইসলামিক বর্ণনা">শান্ত ও স্নিগ্ধ ইসলামিক বর্ণনা</option>
            </select>
          </div>

          {/* Timing & Word Meta */}
          <div className="space-y-1 bg-slate-900/70 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
            <div className="flex items-center justify-between text-slate-400">
              <span>মোট শব্দ সংখ্যা:</span>
              <span className="font-mono tabular-nums text-slate-200 font-bold">{wordCount} শব্দ</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>আনুমানিক ভয়েস দৈর্ঘ্য:</span>
              <span className="font-mono tabular-nums text-amber-400 font-bold">
                {formatTime(estimatedSeconds)} (১ মিনিট ২০ সেকেন্ড)
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Error alert if any */}
      {errorMsg && (
        <div className="p-4 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl shadow-lg flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Big Master Audio Player Card (Active when generated) */}
      <div className="bg-[#0D121F] border border-amber-500/30 rounded-2xl p-6 md:p-8 space-y-5 shadow-2xl relative">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
                <span>{episode.title}</span>
                <span>·</span>
                <span>ভয়েস: {selectedVoice}</span>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white mt-0.5">
                {episode.fullAudioBlobUrl ? 'সম্পূর্ণ অডিও তৈরি সম্পন্ন' : 'ভয়েসওভার অডিও তৈরি করুন'}
              </h2>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Generate Full Audio Button */}
            <button
              onClick={handleGenerateFullVoiceover}
              disabled={episode.isGeneratingFullAudio}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-60"
            >
              {episode.isGeneratingFullAudio ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                  <span>পুরো অডিও তৈরি হচ্ছে (জেমিনাই TTS)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-slate-950" />
                  <span>
                    {episode.fullAudioBlobUrl ? 'পুনরায় পুরো ভয়েস বানান' : 'এক ক্লিকে পুরো ১:২০ অডিও তৈরি করুন'}
                  </span>
                </>
              )}
            </button>

            {/* Download WAV button */}
            {episode.fullAudioBase64 && (
              <button
                onClick={() =>
                  downloadWav(
                    episode.fullAudioBase64!,
                    `full_voiceover_1m20s_${episode.id}.wav`
                  )
                }
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] cursor-pointer"
                title="সম্পূর্ণ অডিও ফাইলটি WAV ফরম্যাটে ডাউনলোড করুন"
              >
                <Download className="w-5 h-5" />
                <span>ডাউনলোড অডিও (.WAV)</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-time Waveform Visualizer & Playhead */}
        <div className="bg-[#060911] border border-slate-800 rounded-xl p-4 md:p-5 space-y-4">
          
          {/* Animated Waveform bars */}
          <div className="h-16 flex items-center justify-between gap-1 px-2 overflow-hidden">
            {Array.from({ length: 48 }).map((_, i) => {
              const played = (currentTimeSec / audioDuration) * 48 > i;
              const barHeight = isPlaying
                ? Math.max(15, Math.sin(i * 0.4 + currentTimeSec * 2) * 24 + 32)
                : Math.max(10, Math.sin(i * 0.3) * 18 + 24);

              return (
                <div
                  key={i}
                  className={`w-full rounded-full transition-all duration-150 cursor-pointer ${
                    played
                      ? 'bg-amber-400 shadow-sm shadow-amber-400/30'
                      : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                  style={{ height: `${barHeight}px` }}
                  onClick={() => handleSeek((i / 48) * audioDuration)}
                />
              );
            })}
          </div>

          {/* Interactive Timeline Progress Slider */}
          <div className="space-y-1.5">
            <input
              type="range"
              min={0}
              max={audioDuration}
              value={currentTimeSec}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              disabled={!episode.fullAudioBlobUrl}
              className="w-full h-2 accent-amber-400 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex items-center justify-between text-xs font-mono tabular-nums text-slate-400">
              <span className="text-amber-400 font-bold">{formatTime(currentTimeSec)}</span>
              <span>মোট দৈর্ঘ্য: {formatTime(audioDuration)}</span>
            </div>
          </div>

          {/* Player Control Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            
            <div className="flex items-center gap-3">
              {/* Skip -10s */}
              <button
                onClick={() => handleSkip(-10)}
                disabled={!episode.fullAudioBlobUrl}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
                title="১০ সেকেন্ড পেছনে যান"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Master Play/Pause */}
              <button
                onClick={handleTogglePlay}
                disabled={episode.isGeneratingFullAudio}
                className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-md shadow-amber-400/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-5 h-5 fill-slate-950" />
                    <span>থামান (Pause)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-slate-950" />
                    <span>{episode.fullAudioBlobUrl ? 'প্লে করুন' : 'ভয়েস বানিয়ে প্লে করুন'}</span>
                  </>
                )}
              </button>

              {/* Skip +10s */}
              <button
                onClick={() => handleSkip(10)}
                disabled={!episode.fullAudioBlobUrl}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
                title="১০ সেকেন্ড সামনে যান"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Playback Speed Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">গতি:</span>
              {[0.85, 1.0, 1.15].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-1 rounded-md font-mono tabular-nums transition-colors ${
                    playbackSpeed === spd
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

          </div>

        </div>

      </div>

      {/* Script Text Editor & Live Highlighter Card */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4 shadow-xl">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>সম্পূর্ণ ১:২০ ভয়েসওভার স্ক্রিপ্ট (সম্পাদনাযোগ্য)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              আপনি প্রয়োজনমতো যেকোনো শব্দ পরিবর্তন করে আবার নতুন করে অডিও তৈরি করতে পারেন।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetScript}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer"
              title="মূল স্ক্রিপ্টে ফিরিয়ে নিন"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>রিসেট</span>
            </button>

            <button
              onClick={handleCopyScript}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'কপি হয়েছে' : 'টেক্সট কপি'}</span>
            </button>
          </div>
        </div>

        {/* Text Area */}
        <textarea
          value={scriptText}
          onChange={(e) => setScriptText(e.target.value)}
          rows={10}
          className="w-full bg-[#050811] border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 rounded-xl p-4 md:p-5 text-slate-100 font-script text-base md:text-lg leading-loose resize-y transition-colors"
          placeholder="এখানে সম্পূর্ণ ১ মিনিট ২০ সেকেন্ডের বাংলা ভয়েসওভার লিখুন..."
        />

        {/* 5-Scene Breakdown Reference Bar */}
        <div className="pt-2">
          <div className="text-xs text-slate-400 mb-2 font-medium">টাইমলাইন রেফারেন্স:</div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px]">
            {episode.scenes.map((sc, i) => (
              <div
                key={sc.id}
                className="bg-slate-900/80 border border-slate-800/80 p-2.5 rounded-lg space-y-1"
              >
                <div className="font-mono tabular-nums text-amber-400 font-semibold">
                  {sc.timestampLabel}
                </div>
                <div className="text-slate-300 font-medium truncate">{sc.title}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
