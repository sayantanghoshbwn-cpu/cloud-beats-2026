import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, ArrowLeft, Disc3, Music2, Plus } from 'lucide-react';
import { playlistAPI } from '../services/api';
import { SongRow } from '../components/SongRow';
import { usePlayer } from '../context/PlayerContext';

export const PlaylistDetail = () => {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const { playSong } = usePlayer();

  useEffect(() => {
    fetchPlaylist();
  }, [id]);

  const fetchPlaylist = async () => {
    try {
      setLoading(true);
      const res = await playlistAPI.getPlaylistById(id);
      if (res.data.success) {
        setPlaylist(res.data.playlist);
      }
    } catch (err) {
      console.error('Error fetching playlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAll = () => {
    if (playlist && playlist.songs && playlist.songs.length > 0) {
      playSong(playlist.songs[0], playlist.songs);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-obsidian-400">
        <Disc3 className="w-8 h-8 text-neonGreen animate-spin mb-3" />
        <p className="text-xs font-mono">Loading playlist details...</p>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="p-8 text-center text-obsidian-400">
        <p>Playlist not found.</p>
        <Link to="/playlists" className="text-neonGreen text-xs mt-2 inline-block">
          ← Back to Playlists
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <Link
        to="/playlists"
        className="inline-flex items-center gap-1.5 text-xs text-obsidian-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Playlists
      </Link>

      {/* Playlist Hero */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 p-6 rounded-3xl bg-gradient-to-br from-obsidian-900 to-obsidian-850 border border-obsidian-800">
        <div className="w-40 h-40 rounded-2xl bg-gradient-to-tr from-neonPurple to-neonGreen p-1 flex items-center justify-center flex-shrink-0 shadow-neon-purple">
          <div className="w-full h-full bg-obsidian-950 rounded-[14px] flex items-center justify-center">
            <Music2 className="w-16 h-16 text-neonGreen" />
          </div>
        </div>

        <div className="space-y-2 flex-1">
          <span className="text-xs font-mono font-bold text-neonGreen uppercase tracking-wider">
            Public Playlist
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {playlist.name}
          </h1>
          <p className="text-sm text-obsidian-300 max-w-xl">
            {playlist.description || 'Curated music streamed securely from AWS S3.'}
          </p>

          <div className="flex items-center gap-4 text-xs font-mono text-obsidian-400 pt-2">
            <span>Created by <span className="text-white">{playlist.user?.name || 'Curator'}</span></span>
            <span>•</span>
            <span>{playlist.songs?.length || 0} Songs</span>
          </div>
        </div>

        {playlist.songs?.length > 0 && (
          <button
            onClick={handlePlayAll}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-neonGreen text-obsidian-950 font-bold text-sm shadow-neon-green hover:scale-105 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            Play All
          </button>
        )}
      </div>

      {/* Songs Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-3 py-2 text-xs font-mono text-obsidian-400 border-b border-obsidian-800">
          <span># Track</span>
          <span className="hidden md:inline">Album & Genre</span>
          <span>Duration</span>
        </div>

        {playlist.songs && playlist.songs.length > 0 ? (
          <div className="space-y-1.5">
            {playlist.songs.map((song, index) => (
              <SongRow
                key={song._id || index}
                song={song}
                index={index}
                playlist={playlist.songs}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-obsidian-400">
            <p className="text-sm">No tracks in this playlist yet.</p>
            <Link
              to="/search"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-neonGreen font-semibold hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              Discover tracks to add
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

