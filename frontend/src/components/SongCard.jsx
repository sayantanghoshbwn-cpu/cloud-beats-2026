import React from 'react';
import { Play, Pause, Music, Radio } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const SongCard = ({ song, playlist = [] }) => {
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();

  const isCurrent = currentSong?._id === song._id;

  const handlePlayClick = (e) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song, playlist.length > 0 ? playlist : [song]);
    }
  };

  const formatDuration = (secs) => {
    if (!secs) return '3:20';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      onClick={handlePlayClick}
      className={`group relative p-3.5 rounded-2xl bg-obsidian-850/80 hover:bg-obsidian-800 border transition-all duration-300 cursor-pointer ${
        isCurrent
          ? 'border-neonGreen/50 shadow-neon-green bg-obsidian-800/90'
          : 'border-obsidian-800 hover:border-obsidian-700 hover:shadow-xl'
      }`}
    >
      {/* Cover Image Container */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-obsidian-950 mb-3">
        <img
          src={song.coverUrl || '/default-cover.svg'}
          alt={song.title}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/default-cover.svg';
          }}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Play Overlay Button */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-200 ${
            isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <button
            onClick={handlePlayClick}
            className="w-12 h-12 rounded-full bg-neonGreen text-obsidian-950 flex items-center justify-center shadow-neon-green hover:scale-110 active:scale-95 transition-transform"
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Genre Pill */}
        {song.genre && (
          <span className="absolute top-2.5 left-2.5 text-[10px] font-mono px-2 py-0.5 rounded-md bg-obsidian-950/80 backdrop-blur-md text-neonPurple border border-neonPurple/30 font-medium">
            {song.genre}
          </span>
        )}
      </div>

      {/* Song Details */}
      <div className="space-y-1">
        <h3
          className={`text-sm font-bold truncate transition-colors ${
            isCurrent ? 'text-neonGreen' : 'text-white group-hover:text-neonGreen'
          }`}
        >
          {song.title}
        </h3>
        <p className="text-xs text-obsidian-400 truncate">{song.artist}</p>
        <div className="flex items-center justify-between text-[11px] font-mono text-obsidian-500 pt-1">
          <span>{song.album || 'Single'}</span>
          <span>{formatDuration(song.duration)}</span>
        </div>
      </div>
    </div>
  );
};

