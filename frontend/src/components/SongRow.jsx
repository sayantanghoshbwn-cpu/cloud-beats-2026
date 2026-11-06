import React from 'react';
import { Play, Pause, Trash2, Edit2, Clock, Music } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const SongRow = ({
  song,
  index,
  playlist = [],
  isAdminView = false,
  onEdit = null,
  onDelete = null,
}) => {
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();

  const isCurrent = currentSong?._id === song._id;

  const handlePlay = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song, playlist.length > 0 ? playlist : [song]);
    }
  };

  const formatDuration = (secs) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className={`group flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
        isCurrent
          ? 'bg-neonGreen/10 border-neonGreen/30 text-white'
          : 'bg-obsidian-850/50 hover:bg-obsidian-850 border-transparent hover:border-obsidian-800 text-obsidian-300'
      }`}
    >
      {/* Left: Index & Play, Artwork, Title/Artist */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Index or Play Button */}
        <div className="w-6 text-center flex items-center justify-center">
          <button
            onClick={handlePlay}
            className="hidden group-hover:flex text-neonGreen hover:scale-110 transition-transform"
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
          <span
            className={`text-xs font-mono group-hover:hidden ${
              isCurrent ? 'text-neonGreen font-bold' : 'text-obsidian-500'
            }`}
          >
            {isCurrent && isPlaying ? (
              <span className="w-2 h-2 rounded-full bg-neonGreen animate-ping inline-block"></span>
            ) : (
              index + 1
            )}
          </span>
        </div>

        {/* Cover thumbnail */}
        <img
          src={song.coverUrl || '/default-cover.svg'}
          alt={song.title}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/default-cover.svg';
          }}
          className="w-10 h-10 rounded-lg object-cover bg-obsidian-950 flex-shrink-0"
        />

        {/* Title and artist */}
        <div className="min-w-0 flex-1">
          <p
            onClick={handlePlay}
            className={`text-sm font-semibold truncate cursor-pointer hover:underline ${
              isCurrent ? 'text-neonGreen' : 'text-white'
            }`}
          >
            {song.title}
          </p>
          <p className="text-xs text-obsidian-400 truncate">{song.artist}</p>
        </div>
      </div>

      {/* Center: Album & Genre */}
      <div className="hidden md:flex items-center gap-6 text-xs text-obsidian-400 flex-1 px-4">
        <span className="truncate max-w-[150px]">{song.album || 'Single'}</span>
        <span className="px-2 py-0.5 rounded-full bg-obsidian-800 text-neonPurple border border-neonPurple/20 text-[10px] font-mono">
          {song.genre || 'Music'}
        </span>
      </div>

      {/* Right: Duration & Actions */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <span className="text-xs font-mono text-obsidian-400">
          {formatDuration(song.duration)}
        </span>

        {isAdminView && (
          <div className="flex items-center gap-1.5 ml-2">
            {onEdit && (
              <button
                onClick={() => onEdit(song)}
                title="Edit song metadata"
                className="p-1.5 rounded-lg text-obsidian-400 hover:text-neonGreen hover:bg-obsidian-800 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(song)}
                title="Delete from S3 and MongoDB"
                className="p-1.5 rounded-lg text-obsidian-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

