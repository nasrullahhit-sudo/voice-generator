import React from 'react';
import { ViewMode, Episode } from '../types.ts';
import { Sparkles, Volume2, VolumeX, Film, FileText, Tv, FileAudio } from 'lucide-react';

interface NavbarProps {
  currentView: ViewMode;
  onSelectView: (mode: ViewMode) => void;
  isAmbientPlaying: boolean;
  onToggleAmbient: () => void;
  ambientVolume: number;
  onChangeAmbientVolume: (vol: number) => void;
  episodes: Episode[];
  activeEpisodeId: string;
  onSelectEpisode: (id: string) => void;
  onOpenGenerateModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  isAmbientPlaying,
  onToggleAmbient,
  ambientVolume,
  onChangeAmbientVolume,
  episodes,
  activeEpisodeId,
  onSelectEpisode,
  onOpenGenerateModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090D16]/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        
        {/* Zone 1: Single Brand Wordmark element */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onSelectView('full-audio');
            }}
            className="group flex items-baseline gap-2 text-slate-100 whitespace-nowrap shrink-0"
          >
            <span className="font-display text-xl md:text-2xl font-bold tracking-tight text-amber-400 group-hover:text-amber-300 transition-colors">
              কাসাসুল আম্বিয়া
            </span>
            <span className="text-xs text-slate-400 tracking-wider font-light uppercase hidden sm:inline">
              Voice Studio
            </span>
          </a>

          {/* Episode Dropdown Switcher */}
          <div className="relative inline-block ml-2">
            <select
              value={activeEpisodeId}
              onChange={(e) => onSelectEpisode(e.target.value)}
              className="bg-slate-900/90 border border-slate-700/80 text-amber-200 text-xs rounded-lg px-2.5 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer appearance-none transition-colors hover:border-slate-600"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f59e0b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1em',
              }}
            >
              {episodes.map((ep) => (
                <option key={ep.id} value={ep.id} className="bg-slate-900 text-slate-100">
                  {ep.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => onSelectView('full-audio')}
            className={`flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentView === 'full-audio'
                ? 'text-amber-400 border-b-2 border-amber-400 font-bold'
                : 'hover:text-slate-200'
            }`}
          >
            <FileAudio className="w-4 h-4 text-amber-400" />
            <span>একসাথে পুরো ভয়েসওভার (১:২০)</span>
          </button>

          <button
            onClick={() => onSelectView('player')}
            className={`flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentView === 'player'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>সিনেম্যাটিক প্লেয়ার</span>
          </button>

          <button
            onClick={() => onSelectView('studio')}
            className={`flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentView === 'studio'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>দৃশ্যভিত্তিক স্ক্রিপ্ট</span>
          </button>

          <button
            onClick={() => onSelectView('teleprompter')}
            className={`flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentView === 'teleprompter'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>টেলিপম্পটার</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action + Ambient Audio Control */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Ambient BGM Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-lg p-1.5 px-2.5">
            <button
              onClick={onToggleAmbient}
              title={isAmbientPlaying ? 'অ্যাম্বিয়েন্ট মিউজিক থামান' : 'অ্যাম্বিয়েন্ট মিউজিক চালু করুন'}
              className={`p-1 rounded transition-colors ${
                isAmbientPlaying
                  ? 'text-amber-400 bg-amber-950/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isAmbientPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <span className="text-[11px] text-slate-400 hidden sm:inline whitespace-nowrap">
              {isAmbientPlaying ? 'সুর চালু' : 'অ্যাম্বিয়েন্ট'}
            </span>
            {isAmbientPlaying && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ambientVolume}
                onChange={(e) => onChangeAmbientVolume(parseFloat(e.target.value))}
                className="w-14 h-1 accent-amber-400 cursor-pointer hidden md:block"
                title="অ্যাম্বিয়েন্ট ভলিউম"
              />
            )}
          </div>

          {/* Primary Action Button */}
          <button
            onClick={onOpenGenerateModal}
            className="flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-sm shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span className="hidden sm:inline">পরবর্তী পর্ব লিখুন (AI)</span>
            <span className="sm:hidden">নতুন পর্ব</span>
          </button>
        </div>

      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex lg:hidden items-center justify-around gap-1.5 pt-2.5 mt-2.5 border-t border-slate-800/60 text-xs overflow-x-auto">
        <button
          onClick={() => onSelectView('full-audio')}
          className={`flex items-center gap-1.5 py-1 px-2.5 rounded-md whitespace-nowrap shrink-0 ${
            currentView === 'full-audio' ? 'text-amber-400 bg-amber-950/40 font-bold' : 'text-slate-400'
          }`}
        >
          <FileAudio className="w-3.5 h-3.5 text-amber-400" />
          <span>ফুল অডিও (১:২০)</span>
        </button>
        <button
          onClick={() => onSelectView('player')}
          className={`flex items-center gap-1.5 py-1 px-2 rounded-md whitespace-nowrap shrink-0 ${
            currentView === 'player' ? 'text-amber-400 bg-amber-950/30 font-medium' : 'text-slate-400'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>প্লেয়ার</span>
        </button>
        <button
          onClick={() => onSelectView('studio')}
          className={`flex items-center gap-1.5 py-1 px-2 rounded-md whitespace-nowrap shrink-0 ${
            currentView === 'studio' ? 'text-amber-400 bg-amber-950/30 font-medium' : 'text-slate-400'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>স্ক্রিপ্ট</span>
        </button>
        <button
          onClick={() => onSelectView('teleprompter')}
          className={`flex items-center gap-1.5 py-1 px-2 rounded-md ${
            currentView === 'teleprompter' ? 'text-amber-400 bg-amber-950/30 font-medium' : 'text-slate-400'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>টেলিপম্পটার</span>
        </button>
      </div>
    </header>
  );
};
