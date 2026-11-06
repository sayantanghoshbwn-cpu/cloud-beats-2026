import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  ListMusic,
  Radio,
  Loader2,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const Player = () => {
  const {
    currentSong,
    isPlaying,
    isLoadingStream,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    playNext,
    playPrev,
    toggleNowPlaying,
    streamError,
  } = usePlayer();

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleSeekChange = (e) => {
    seek(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
  };

  // If no song selected yet, show placeholder bar
  if (!currentSong) {
    return (
      <footer className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-obsidian-900/90 backdrop-blur-xl border-t border-obsidian-800 flex items-center justify-between px-6 text-obsidian-400">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-obsidian-850 flex items-center justify-center border border-obsidian-800">
            <Radio className="w-5 h-5 text-obsidian-600 animate-pulse" />
          </div>
          <span className="text-xs">Select any track to stream via AWS S3 Presigned URL...</span>
        </div>
      </footer>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 h-[88px] bg-obsidian-900/95 backdrop-blur-2xl border-t border-obsidian-800 shadow-2xl flex flex-col justify-center px-4 lg:px-8">
      {/* Top micro progress bar indicator */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-obsidian-800">
        <div
          className="h-full bg-gradient-to-r from-neonGreen via-emerald-400 to-neonPurple transition-all duration-150"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Left: Song Artwork & Info */}
        <div className="flex items-center gap-3.5 min-w-[200px] max-w-[30%]">
          <div className="relative group cursor-pointer" onClick={toggleNowPlaying}>
            <img
              src={currentSong.coverUrl || '/default-cover.svg'}
              alt={currentSong.title}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-cover.svg';
              }}
              className="w-14 h-14 rounded-xl object-cover shadow-md border border-obsidian-750 group-hover:opacity-80 transition-opacity"
            />
            <button className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity">
              <Maximize2 className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="flex flex-col overflow-hidden">
            <span
              onClick={toggleNowPlaying}
              className="text-sm font-bold text-white hover:text-neonGreen cursor-pointer truncate transition-colors"
            >
              {currentSong.title}
            </span>
            <span className="text-xs text-obsidian-400 truncate">
              {currentSong.artist} • {currentSong.album}
            </span>
            <span className="text-[10px] text-neonGreen font-mono font-medium truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-neonGreen animate-ping"></span>
              S3: {currentSong.audioKey}
            </span>
          </div>
        </div>

        {/* Center: Controls & Audio Scrubber */}
        <div className="flex flex-col items-center gap-1.5 w-full max-w-2xl px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={playPrev}
              title="Previous Track"
              className="p-1.5 text-obsidian-400 hover:text-white transition-colors"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlay}
              disabled={isLoadingStream}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-neonGreen to-emerald-400 hover:scale-105 active:scale-95 text-obsidian-950 flex items-center justify-center shadow-neon-green transition-transform disabled:opacity-50"
            >
              {isLoadingStream ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={playNext}
              title="Next Track"
              className="p-1.5 text-obsidian-400 hover:text-white transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Time & Audio Range Scrub Bar */}
          <div className="flex items-center gap-3 w-full">
            <span className="text-[11px] font-mono text-obsidian-400 w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <div className="relative w-full flex items-center">
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={handleSeekChange}
                className="w-full"
                title="Seek audio (HTTP Range Request to S3)"
              />
            </div>
            <span className="text-[11px] font-mono text-obsidian-400 w-10">
              {formatTime(duration)}
            </span>
          </div>

          {streamError && (
            <p className="text-[10px] text-rose-400 font-mono -mt-1">{streamError}</p>
          )}
        </div>

        {/* Right: Volume & Extra Controls */}
        <div className="hidden sm:flex items-center gap-4 min-w-[200px] justify-end">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-1.5 text-obsidian-400 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-neonGreen" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20"
              title="Volume"
            />
          </div>

          <button
            onClick={toggleNowPlaying}
            title="Now Playing S3 Panel"
            className="p-2 rounded-xl bg-obsidian-850 hover:bg-obsidian-800 text-neonPurple border border-neonPurple/20 transition-all hover:scale-105"
          >
            <ListMusic className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};

