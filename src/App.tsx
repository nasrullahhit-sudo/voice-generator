/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Episode, Scene, ViewMode } from './types.ts';
import { INITIAL_EPISODES } from './data/episodes.ts';
import { ambientSound } from './services/ambientAudio.ts';
import { Navbar } from './components/Navbar.tsx';
import { FullVoiceoverStudio } from './components/FullVoiceoverStudio.tsx';
import { CinematicPlayer } from './components/CinematicPlayer.tsx';
import { ScriptStudio } from './components/ScriptStudio.tsx';
import { TeleprompterView } from './components/TeleprompterView.tsx';
import { GenerateEpisodeModal } from './components/GenerateEpisodeModal.tsx';

export default function App() {
  const [episodes, setEpisodes] = useState<Episode[]>(INITIAL_EPISODES);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string>(INITIAL_EPISODES[0].id);
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [currentView, setCurrentView] = useState<ViewMode>('full-audio');
  const [isAmbientPlaying, setIsAmbientPlaying] = useState<boolean>(false);
  const [ambientVolume, setAmbientVolume] = useState<number>(0.35);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState<boolean>(false);

  const activeEpisode =
    episodes.find((ep) => ep.id === activeEpisodeId) || episodes[0];

  // Ambient sound controls
  const handleToggleAmbient = () => {
    if (isAmbientPlaying) {
      ambientSound.stop();
      setIsAmbientPlaying(false);
    } else {
      ambientSound.setVolume(ambientVolume);
      ambientSound.start();
      setIsAmbientPlaying(true);
    }
  };

  const handleChangeAmbientVolume = (vol: number) => {
    setAmbientVolume(vol);
    ambientSound.setVolume(vol);
  };

  // Update a scene within the active episode
  const handleUpdateEpisodeScene = (sceneId: string, updates: Partial<Scene>) => {
    setEpisodes((prev) =>
      prev.map((ep) => {
        if (ep.id !== activeEpisodeId) return ep;
        return {
          ...ep,
          scenes: ep.scenes.map((sc) =>
            sc.id === sceneId ? { ...sc, ...updates } : sc
          ),
        };
      })
    );
  };

  // Update active episode (e.g. full voiceover audio)
  const handleUpdateActiveEpisode = (updates: Partial<Episode>) => {
    setEpisodes((prev) =>
      prev.map((ep) => (ep.id === activeEpisodeId ? { ...ep, ...updates } : ep))
    );
  };

  // Switch episode
  const handleSelectEpisode = (id: string) => {
    setActiveEpisodeId(id);
    setActiveSceneIndex(0);
  };

  // Switch to player view focused on a specific scene
  const handleSwitchToPlayerScene = (index: number) => {
    setActiveSceneIndex(index);
    setCurrentView('player');
  };

  // Add newly AI-generated episode
  const handleEpisodeCreated = (newEpisode: Episode) => {
    setEpisodes((prev) => [...prev, newEpisode]);
    setActiveEpisodeId(newEpisode.id);
    setActiveSceneIndex(0);
    setCurrentView('full-audio');
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Top Bar Navigation */}
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        isAmbientPlaying={isAmbientPlaying}
        onToggleAmbient={handleToggleAmbient}
        ambientVolume={ambientVolume}
        onChangeAmbientVolume={handleChangeAmbientVolume}
        episodes={episodes}
        activeEpisodeId={activeEpisodeId}
        onSelectEpisode={handleSelectEpisode}
        onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 px-4 md:px-8 py-6 max-w-7xl mx-auto w-full">
        {currentView === 'full-audio' && (
          <FullVoiceoverStudio
            episode={activeEpisode}
            isAmbientPlaying={isAmbientPlaying}
            onToggleAmbient={handleToggleAmbient}
            onUpdateEpisode={handleUpdateActiveEpisode}
          />
        )}

        {currentView === 'player' && (
          <CinematicPlayer
            episode={activeEpisode}
            activeSceneIndex={activeSceneIndex}
            onSelectSceneIndex={setActiveSceneIndex}
            isAmbientPlaying={isAmbientPlaying}
            onToggleAmbient={handleToggleAmbient}
            onUpdateEpisodeScene={handleUpdateEpisodeScene}
          />
        )}

        {currentView === 'studio' && (
          <ScriptStudio
            episode={activeEpisode}
            onUpdateEpisodeScene={handleUpdateEpisodeScene}
            onSwitchToPlayerScene={handleSwitchToPlayerScene}
          />
        )}

        {currentView === 'teleprompter' && (
          <TeleprompterView
            episode={activeEpisode}
            isAmbientPlaying={isAmbientPlaying}
            onToggleAmbient={handleToggleAmbient}
          />
        )}
      </main>

      {/* Quiet Cinematic Footer */}
      <footer className="border-t border-slate-900 bg-[#070A11] px-4 md:px-8 py-5 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">কাসাসুল আম্বিয়া</span>
            <span aria-hidden="true">·</span>
            <span>নবী ও রাসূলগণের ধারাবাহিক শিক্ষণীয় ইতিহাস ও সিনেম্যাটিক স্ক্রিপ্ট স্টুডিও</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
            <span>মডেল: gemini-3.8-flash-tts</span>
            <span aria-hidden="true">·</span>
            <span>gemini-3.8-flash</span>
          </div>
        </div>
      </footer>

      {/* Modal for AI episode creation */}
      <GenerateEpisodeModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onEpisodeCreated={handleEpisodeCreated}
        nextEpisodeNumber={episodes.length + 1}
      />

    </div>
  );
}
