import React, { useState, useEffect, useRef } from 'react';
import { Episode } from '../types.ts';
import {
  Play,
  Pause,
  RotateCcw,
  FlipHorizontal,
  Type,
  Gauge,
  Sparkles,
} from 'lucide-react';

interface TeleprompterViewProps {
  episode: Episode;
  isAmbientPlaying: boolean;
  onToggleAmbient: () => void;
}

export const TeleprompterView: React.FC<TeleprompterViewProps> = ({
  episode,
  isAmbientPlaying,
  onToggleAmbient,
}) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2); // pixels per frame
  const [fontSize, setFontSize] = useState(36); // px
  const [isMirrored, setIsMirrored] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const scrollStep = () => {
      if (containerRef.current && isScrolling) {
        containerRef.current.scrollTop += scrollSpeed * 0.4;
        if (
          containerRef.current.scrollTop + containerRef.current.clientHeight >=
          containerRef.current.scrollHeight - 10
        ) {
          setIsScrolling(false);
          return;
        }
      }
      if (isScrolling) {
        animationFrameRef.current = requestAnimationFrame(scrollStep);
      }
    };

    if (isScrolling) {
      animationFrameRef.current = requestAnimationFrame(scrollStep);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isScrolling, scrollSpeed]);

  const handleResetScroll = () => {
    setIsScrolling(false);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      
      {/* Teleprompter Control Toolbar */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        
        {/* Play/Pause & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScrolling(!isScrolling)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
          >
            {isScrolling ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950" />}
            <span>{isScrolling ? 'স্ক্রোল থামান' : 'অটো-স্ক্রোল শুরু'}</span>
          </button>

          <button
            onClick={handleResetScroll}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="শুরুতে ফিরে যান"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Speed & Font adjustments */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
          
          {/* Scroll Speed */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span>গতি:</span>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={scrollSpeed}
              onChange={(e) => setScrollSpeed(parseFloat(e.target.value))}
              className="w-16 accent-amber-400 cursor-pointer"
            />
            <span className="font-mono tabular-nums text-amber-400">{scrollSpeed}x</span>
          </div>

          {/* Font Size */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <Type className="w-3.5 h-3.5 text-amber-400" />
            <span>ফন্ট সাইজ:</span>
            <input
              type="range"
              min="24"
              max="54"
              step="2"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-20 accent-amber-400 cursor-pointer"
            />
            <span className="font-mono tabular-nums text-amber-400">{fontSize}px</span>
          </div>

          {/* Mirror Flip for Teleprompter Rig */}
          <button
            onClick={() => setIsMirrored(!isMirrored)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
              isMirrored
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="টেলিপম্পটার মিরর রিভার্স মোড"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
            <span>মিরর রিভার্স</span>
          </button>

        </div>

      </div>

      {/* Main Teleprompter Read Screen */}
      <div
        ref={containerRef}
        className={`w-full h-[65vh] bg-[#03060E] border-2 border-slate-800/80 rounded-2xl overflow-y-auto p-8 md:p-14 select-none transition-transform duration-300 ${
          isMirrored ? 'scale-x-[-1]' : ''
        }`}
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="max-w-3xl mx-auto space-y-16 py-12">
          
          {/* Header introduction */}
          <div className="text-center space-y-2 border-b border-slate-800/80 pb-8">
            <div className="text-sm font-mono text-amber-400 tracking-wider">
              {episode.title}
            </div>
            <div className="text-xs text-slate-500">
              দৈর্ঘ্য: {episode.duration} · টোন: {episode.tone}
            </div>
          </div>

          {/* Scenes in succession */}
          {episode.scenes.map((scene, i) => (
            <div key={scene.id} className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-amber-400/80 font-mono font-medium">
                <span>[দৃশ্য {i + 1}]</span>
                <span>{scene.timestampLabel}</span>
                <span>·</span>
                <span>{scene.title}</span>
              </div>

              {/* Visual cue in quiet subtitle format */}
              <div className="text-sm italic text-slate-500 pl-4 border-l-2 border-amber-500/30">
                (ভিজুয়াল: {scene.visualPrompt})
              </div>

              {/* Main narration text */}
              <p
                className="font-script text-slate-100 font-medium leading-[1.8] text-balance transition-all"
                style={{ fontSize: `${fontSize}px` }}
              >
                {scene.voiceoverText}
              </p>
            </div>
          ))}

          {/* Outro */}
          <div className="text-center pt-12 border-t border-slate-800/80 text-slate-400 text-base">
            <span className="text-amber-400 font-semibold block mb-2">সমাপ্ত</span>
            <p className="italic text-slate-300">{episode.outroTeaser}</p>
          </div>

        </div>
      </div>

    </div>
  );
};
