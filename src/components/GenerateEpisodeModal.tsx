import React, { useState } from 'react';
import { Episode } from '../types.ts';
import { X, Sparkles, Loader2, BookOpen } from 'lucide-react';
import { EPISODE_1_IMAGES } from '../data/episodes.ts';

interface GenerateEpisodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEpisodeCreated: (newEpisode: Episode) => void;
  nextEpisodeNumber: number;
}

const PROPHET_PRESETS = [
  'হযরত ইদরিস (আ.)',
  'হযরত নূহ (আ.) ও মহাপ্লাবন',
  'হযরত হুদ (আ.) ও আদ জাতি',
  'হযরত সালেহ (আ.) ও সামুদ জাতি',
  'হযরত ইব্রাহিম (আ.) ও তাওহীদের সংগ্রাম',
  'হযরত ইসমাইল (আ.) ও কুরবানির ইতিহাস',
  'হযরত ইউসুফ (আ.) ও স্বপ্নের রহস্য',
  'হযরত মুসা (আ.) ও ফেরাউনের পতন',
  'হযরত দাউদ (আ.) ও জালুতের মোকাবিলা',
  'হযরত সুলাইমান (আ.) ও অতুলনীয় রাজত্ব',
  'হযরত ইউনুস (আ.) ও মাছের পেট থেকে ফেরা',
  'হযরত ঈসা (আ.) ও অলৌকিক নিদর্শন',
];

export const GenerateEpisodeModal: React.FC<GenerateEpisodeModalProps> = ({
  isOpen,
  onClose,
  onEpisodeCreated,
  nextEpisodeNumber,
}) => {
  const [prophetName, setProphetName] = useState(PROPHET_PRESETS[1]);
  const [customName, setCustomName] = useState('');
  const [episodeNum, setEpisodeNum] = useState(nextEpisodeNumber);
  const [customInstructions, setCustomInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const targetProphet = customName.trim() || prophetName;

    try {
      const response = await fetch('/api/episodes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prophetName: targetProphet,
          episodeNumber: episodeNum,
          customInstructions: customInstructions.trim(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'পর্ব জেনারেট করতে সমস্যা হয়েছে');
      }

      const data = await response.json();
      if (!data.episode) {
        throw new Error('সার্ভার থেকে সঠিক তথ্য পাওয়া যায়নি');
      }

      const generated = data.episode;

      // Assign fallback images for scenes
      const imageKeys = [
        EPISODE_1_IMAGES.scene5,
        EPISODE_1_IMAGES.scene4,
        EPISODE_1_IMAGES.scene3,
        EPISODE_1_IMAGES.scene2,
        EPISODE_1_IMAGES.scene1,
      ];

      const fullEpisode: Episode = {
        id: `episode-${episodeNum}-${Date.now()}`,
        episodeNumber: generated.episodeNumber || episodeNum,
        title: generated.title || `পর্ব ${episodeNum} — ${targetProphet}`,
        prophetName: generated.prophetName || targetProphet,
        duration: generated.duration || '১ মিনিট ২০ সেকেন্ড',
        durationSeconds: generated.durationSeconds || 80,
        tone: generated.tone || 'গভীর, ভাবগম্ভীর ও সিনেম্যাটিক',
        bgmDescription: generated.bgmDescription || 'মৃদু ও রহস্যময় অ্যাম্বিয়েন্ট সুর',
        outroTeaser: generated.outroTeaser || 'চোখ রাখুন পরবর্তী পর্বে!',
        scenes: generated.scenes.map((sc: any, idx: number) => ({
          ...sc,
          imageUrl: imageKeys[idx % imageKeys.length],
        })),
      };

      onEpisodeCreated(fullEpisode);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'স্ক্রিপ্ট তৈরিতে ত্রুটি দেখা দিয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl w-full max-w-lg p-6 md:p-8 space-y-6 shadow-2xl relative text-slate-100">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">নতুন পর্ব তৈরি করুন (AI Generator)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              জেমিনাই ৩.৮ মডেল দ্বারা ১ মিনিট ২০ সেকেন্ডের সিনেম্যাটিক স্ক্রিপ্ট তৈরি
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 text-xs bg-rose-950/80 border border-rose-800 text-rose-200 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Prophet Preset Selection */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium">নবীর নাম বা বিষয় নির্বাচন করুন:</label>
            <select
              value={prophetName}
              onChange={(e) => {
                setProphetName(e.target.value);
                setCustomName('');
              }}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              {PROPHET_PRESETS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Or Custom Name */}
          <div className="space-y-1.5">
            <label className="text-slate-400">অথবা কাস্টম নবীর নাম/বিষয় লিখুন:</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="যেমন: হযরত সুলাইমান (আ.) ও হুদহুদ পাখি"
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder:text-slate-600"
            />
          </div>

          {/* Episode Number */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium">পর্ব নম্বর (Episode #):</label>
            <input
              type="number"
              min="1"
              max="50"
              value={episodeNum}
              onChange={(e) => setEpisodeNum(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Custom instructions */}
          <div className="space-y-1.5">
            <label className="text-slate-400">বিশেষ কোনো নির্দেশনা (ঐচ্ছিক):</label>
            <textarea
              rows={2}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="যেমন: সাগরের উত্তাল ঢেউয়ের আবহ এবং বিশেষ দোয়ার উল্লেখ রাখুন..."
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 focus:ring-1 focus:ring-amber-500 placeholder:text-slate-600 resize-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>স্ক্রিপ্ট রচিত হচ্ছে (জেমিনাই AI)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>স্ক্রিপ্ট তৈরি করুন</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
