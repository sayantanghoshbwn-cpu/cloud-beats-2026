import React from 'react';
import { X, Play, Pause, Music, Shield, Cloud, HardDrive, Sparkles } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const NowPlayingPanel = () => {
  const {
    currentSong,
    isPlaying,
    togglePlay,
    queue,
    playSong,
    isNowPlayingOpen,
    toggleNowPlaying,
  } = usePlayer();

  if (!isNowPlayingOpen || !currentSong) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-obsidian-900/98 backdrop-blur-2xl border-l border-obsidian-800 shadow-2xl flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-obsidian-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-neonGreen" />
          <h3 className="font-bold text-white text-sm tracking-wide uppercase font-mono">
            Now Playing
          </h3>
        </div>
        <button
          onClick={toggleNowPlaying}
          className="p-1.5 rounded-full hover:bg-obsidian-800 text-obsidian-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Album Artwork & Neon Glow */}
      <div className="mt-6 flex flex-col items-center">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-neonGreen to-neonPurple rounded-2xl blur-lg opacity-40 group-hover:opacity-75 transition duration-500"></div>
          <img
            src={currentSong.coverUrl || '/default-cover.svg'}
            alt={currentSong.title}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-cover.svg';
            }}
            className="relative w-64 h-64 rounded-2xl object-cover shadow-2xl border border-obsidian-700"
          />

          {/* Equalizer animation when playing */}
          {isPlaying && (
            <div className="absolute bottom-4 right-4 flex items-end gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-neonGreen/30">
              <span className="w-1 bg-neonGreen h-4 animate-pulse"></span>
              <span className="w-1 bg-neonPurple h-6 animate-pulse delay-75"></span>
              <span className="w-1 bg-neonGreen h-3 animate-pulse delay-150"></span>
              <span className="w-1 bg-emerald-400 h-5 animate-pulse delay-100"></span>
            </div>
          )}
        </div>

        {/* Title & Artist */}
        <div className="mt-5 text-center">
          <h2 className="text-xl font-extrabold text-white">{currentSong.title}</h2>
          <p className="text-sm text-neonGreen font-medium mt-0.5">{currentSong.artist}</p>
          <p className="text-xs text-obsidian-400 mt-1">{currentSong.album} • {currentSong.genre}</p>
        </div>
      </div>

      {/* AWS S3 Object Architecture Card */}
      <div className="mt-6 p-4 rounded-xl bg-obsidian-950 border border-obsidian-800 space-y-2.5 text-xs font-mono">
        <div className="flex items-center gap-2 text-neonGreen font-semibold">
          <Cloud className="w-4 h-4" />
          <span>AWS S3 Object Metadata</span>
        </div>

        <div className="space-y-1 text-obsidian-300">
          <div className="flex justify-between py-1 border-b border-obsidian-850">
            <span className="text-obsidian-400">Audio Key:</span>
            <span className="text-neonGreen truncate max-w-[170px]" title={currentSong.audioKey}>
              {currentSong.audioKey}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-obsidian-850">
            <span className="text-obsidian-400">Cover Key:</span>
            <span className="text-neonPurple truncate max-w-[170px]" title={currentSong.coverKey || 'None'}>
              {currentSong.coverKey || 'Default'}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-obsidian-850">
            <span className="text-obsidian-400">Storage Class:</span>
            <span className="text-white">STANDARD</span>
          </div>

          <div className="flex justify-between py-1 border-b border-obsidian-850">
            <span className="text-obsidian-400">Security:</span>
            <span className="text-emerald-400">Private (Presigned GET)</span>
          </div>

          <div className="flex justify-between py-1">
            <span className="text-obsidian-400">HTTP Scrubbing:</span>
            <span className="text-neonPurple">Range Headers 206</span>
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="mt-6 flex-1">
        <h4 className="text-xs font-mono font-bold text-obsidian-400 uppercase tracking-wider mb-3">
          Up Next in Queue ({queue.length})
        </h4>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {queue.map((song, index) => {
            const isCurrent = song._id === currentSong._id;
            return (
              <div
                key={song._id || index}
                onClick={() => playSong(song)}
                className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-neonGreen/10 border border-neonGreen/30 text-white'
                    : 'hover:bg-obsidian-800 text-obsidian-300'
                }`}
              >
                <span className="text-[11px] font-mono text-obsidian-500 w-4 text-center">
                  {index + 1}
                </span>
                <img
                  src={song.coverUrl || '/default-cover.svg'}
                  alt=""
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/default-cover.svg';
                  }}
                  className="w-9 h-9 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{song.title}</p>
                  <p className="text-[10px] text-obsidian-400 truncate">{song.artist}</p>
                </div>
                {isCurrent && isPlaying ? (
                  <span className="w-2 h-2 rounded-full bg-neonGreen animate-pulse"></span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

