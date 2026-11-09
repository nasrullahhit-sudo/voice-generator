import React, { useState } from 'react';
import { Episode, Scene, VoicePersona } from '../types.ts';
import { AVAILABLE_VOICES } from '../data/episodes.ts';
import {
  Sparkles,
  Download,
  Copy,
  Check,
  Play,
  Pause,
  Loader2,
  Volume2,
  Clock,
  Music,
  Eye,
  Mic,
  FileDown,
} from 'lucide-react';
import { generateSpeech, downloadWav } from '../services/ttsService.ts';

interface ScriptStudioProps {
  episode: Episode;
  onUpdateEpisodeScene: (sceneId: string, updates: Partial<Scene>) => void;
  onSwitchToPlayerScene: (index: number) => void;
}

export const ScriptStudio: React.FC<ScriptStudioProps> = ({
  episode,
  onUpdateEpisodeScene,
  onSwitchToPlayerScene,
}) => {
  const [selectedVoice, setSelectedVoice] = useState<VoicePersona>('Fenrir');
  const [copiedAll, setCopiedAll] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Play or pause scene audio
  const handleToggleSceneAudio = (scene: Scene) => {
    if (playingAudioId === scene.id) {
      audioElement?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      if (scene.audioBlobUrl) {
        const audio = new Audio(scene.audioBlobUrl);
        audio.onended = () => setPlayingAudioId(null);
        audio.play().catch(console.warn);
        setAudioElement(audio);
        setPlayingAudioId(scene.id);
      }
    }
  };

  // Generate TTS for single scene
  const handleGenerateTTS = async (scene: Scene) => {
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
    } catch (err: any) {
      console.error(err);
      onUpdateEpisodeScene(scene.id, { isGeneratingAudio: false });
      alert(err.message || 'ভয়েস তৈরিতে সমস্যা হয়েছে।');
    }
  };

  // Batch generate all
  const handleBatchGenerateAll = async () => {
    setIsBatchGenerating(true);
    for (const sc of episode.scenes) {
      if (!sc.audioBlobUrl) {
        await handleGenerateTTS(sc);
      }
    }
    setIsBatchGenerating(false);
  };

  // Copy full script
  const handleCopyScript = () => {
    let scriptMarkdown = `ভিডিও স্ক্রিপ্ট: ${episode.title}\n`;
    scriptMarkdown += `দৈর্ঘ্য: ${episode.duration}\n\n`;
    scriptMarkdown += `টোন: ${episode.tone}\n\n`;
    scriptMarkdown += `ব্যাকগ্রাউন্ড মিউজিক: ${episode.bgmDescription}\n\n`;

    episode.scenes.forEach((sc) => {
      scriptMarkdown += `[${sc.timestampLabel}] ${sc.title}\n\n`;
      scriptMarkdown += `(ভিজুয়াল: ${sc.visualPrompt})\n\n`;
      scriptMarkdown += `ভয়েসওভার:\n\n${sc.voiceoverText}\n\n`;
    });

    navigator.clipboard.writeText(scriptMarkdown).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    });
  };

  // Download formatted markdown
  const handleDownloadMarkdown = () => {
    let md = `# ${episode.title}\n\n`;
    md += `**দৈর্ঘ্য:** ${episode.duration} (${episode.durationSeconds} সেকেন্ড)\n`;
    md += `**টোন:** ${episode.tone}\n`;
    md += `**ব্যাকগ্রাউন্ড মিউজিক:** ${episode.bgmDescription}\n\n---\n\n`;

    episode.scenes.forEach((sc, i) => {
      md += `## দৃশ্য ${i + 1}: [${sc.timestampLabel}] ${sc.title}\n\n`;
      md += `**ভিজুয়াল নির্দেশনা:** ${sc.visualPrompt}\n\n`;
      md += `> **ভয়েসওভার:**\n> ${sc.voiceoverText}\n\n`;
    });

    md += `---\n\n*আউটরো টিজার:* ${episode.outroTeaser}\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script_episode_${episode.episodeNumber}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      
      {/* Script Header Meta Card */}
      <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-6 md:p-8 space-y-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-amber-400 font-medium">
              <span>পর্ব {episode.episodeNumber}</span>
              <span aria-hidden="true">·</span>
              <span>{episode.prophetName}</span>
              <span aria-hidden="true">·</span>
              <span>{episode.scenes.length}টি দৃশ্য</span>
            </div>
            <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight mt-1">
              {episode.title}
            </h1>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Copy Script */}
            <button
              onClick={handleCopyScript}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              {copiedAll ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedAll ? 'কপি হয়েছে' : 'স্ক্রিপ্ট কপি'}</span>
            </button>

            {/* Download Markdown */}
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-amber-400" />
              <span>ডকুমেন্ট ডাউনলোড</span>
            </button>

            {/* Batch generate all TTS */}
            <button
              onClick={handleBatchGenerateAll}
              disabled={isBatchGenerating}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg transition-all shadow-sm shadow-amber-500/20 cursor-pointer"
            >
              {isBatchGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>সব ভয়েসওভার বানান (TTS)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tone, Duration & Music Specifications */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 text-xs">
          
          <div className="flex items-start gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
            <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block font-medium">দৈর্ঘ্য</span>
              <span className="text-slate-200 font-semibold">{episode.duration} ({episode.durationSeconds} সেকেন্ড)</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
            <Mic className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block font-medium">টোন</span>
              <span className="text-slate-200 font-semibold">{episode.tone}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
            <Music className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block font-medium">ব্যাকগ্রাউন্ড মিউজিক</span>
              <span className="text-slate-200 font-medium leading-relaxed">{episode.bgmDescription}</span>
            </div>
          </div>

        </div>

        {/* Global Voice Persona selector for studio */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">ভয়েস মডেল:</span>
            <span className="font-mono text-amber-400/90 font-semibold">gemini-3.8-flash-tts</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">কণ্ঠ চরিত্র:</span>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value as VoicePersona)}
              className="bg-slate-950 border border-slate-700 text-amber-300 text-xs rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              {AVAILABLE_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} — {v.banglaLabel}
                </option>
              ))}
            </select>
          </div>
          <span className="text-slate-500 text-[11px]">
            * প্রতিটি দৃশ্যের টেক্সট সরাসরি এডিট করে পুনরায় নতুন অডিও তৈরি করা যায়
          </span>
        </div>

      </div>

      {/* Chronological Scene Cards */}
      <div className="space-y-4">
        {episode.scenes.map((scene, index) => {
          const hasAudio = Boolean(scene.audioBlobUrl);
          const isCurrentlyPlaying = playingAudioId === scene.id;

          return (
            <div
              key={scene.id}
              className="bg-[#0B0F19] border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-5 md:p-6 transition-all duration-200 shadow-md group"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Visual Thumbnail & Metadata (Left Column) */}
                <div className="lg:col-span-4 space-y-3">
                  {/* Scene Number & Timing */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-amber-400">দৃশ্য {index + 1}</span>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono tabular-nums text-slate-300 font-semibold">
                        {scene.timestampLabel}
                      </span>
                    </div>

                    <button
                      onClick={() => onSwitchToPlayerScene(index)}
                      className="text-[11px] text-amber-400/80 hover:text-amber-300 flex items-center gap-1 transition-colors"
                      title="প্লেয়ারে এই দৃশ্যটি দেখুন"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>প্লেয়ারে দেখুন</span>
                    </button>
                  </div>

                  {/* Scene Title */}
                  <h3 className="text-base font-semibold text-slate-100">{scene.title}</h3>

                  {/* Thumbnail Image Container */}
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group-hover:border-slate-700 transition-colors">
                    {scene.imageUrl ? (
                      <img
                        src={scene.imageUrl}
                        alt={scene.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-600 p-3 text-center">
                        কোনো ছবি যুক্ত নেই
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    <span className="absolute bottom-2 left-2 text-[10px] text-amber-300/90 font-mono bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
                      {scene.timestampLabel}
                    </span>
                  </div>

                  {/* Visual Direction Cue */}
                  <div className="text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                    <span className="text-amber-400/90 font-semibold block mb-0.5">ভিজুয়াল নির্দেশনা:</span>
                    <p className="italic leading-relaxed text-slate-300">{scene.visualPrompt}</p>
                  </div>
                </div>

                {/* Voiceover Script & Audio Generation (Right Column) */}
                <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
                  
                  {/* Voiceover text editor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">ভয়েসওভার বিবরণ (Bengali Narration):</span>
                      <span className="text-slate-500 text-[11px]">
                        {scene.voiceoverText.split(/\s+/).filter(Boolean).length} শব্দ · আনুমানিক{' '}
                        {scene.endSec - scene.startSec} সেকেন্ড
                      </span>
                    </div>

                    <textarea
                      value={scene.voiceoverText}
                      onChange={(e) =>
                        onUpdateEpisodeScene(scene.id, {
                          voiceoverText: e.target.value,
                          // clear generated audio on edit to allow fresh re-gen
                          audioBlobUrl: undefined,
                          audioBase64: undefined,
                        })
                      }
                      rows={4}
                      className="w-full bg-[#070A12] border border-slate-800 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 rounded-xl p-3.5 text-slate-100 font-script text-base md:text-lg leading-relaxed resize-y transition-colors"
                      placeholder="এখানে বাংলা ভয়েসওভার লিখুন..."
                    />
                  </div>

                  {/* Audio Controls Bar for this Scene */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                    
                    {/* Audio status & playback */}
                    <div className="flex items-center gap-3">
                      {hasAudio ? (
                        <>
                          <button
                            onClick={() => handleToggleSceneAudio(scene)}
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
                          >
                            {isCurrentlyPlaying ? (
                              <>
                                <Pause className="w-3.5 h-3.5 fill-slate-950" />
                                <span>থামান</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-slate-950" />
                                <span>অডিও শুনুন</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() =>
                              downloadWav(
                                scene.audioBase64!,
                                `scene_${index + 1}_${episode.id}.wav`
                              )
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="WAV ডাউনলোড করুন"
                          >
                            <Download className="w-3.5 h-3.5 text-amber-400" />
                            <span>WAV ডাউনলোড</span>
                          </button>
                        </>
                      ) : (
                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>ভয়েস এখনও জেনারেট করা হয়নি</span>
                        </div>
                      )}
                    </div>

                    {/* Generate / Regenerate TTS Button */}
                    <button
                      onClick={() => handleGenerateTTS(scene)}
                      disabled={scene.isGeneratingAudio}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 rounded-lg transition-colors cursor-pointer"
                    >
                      {scene.isGeneratingAudio ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>ভয়েস তৈরি হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{hasAudio ? 'পুনরায় ভয়েস বানান' : 'ভয়েস বানান (TTS)'}</span>
                        </>
                      )}
                    </button>

                  </div>

                </div>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
