import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ListMusic, Plus, Play, Disc3, Music2, Lock, Globe } from 'lucide-react';
import { playlistAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';

export const Playlists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  const { user } = useAuth();
  const { playSong } = usePlayer();

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const res = await playlistAPI.getPlaylists();
      if (res.data.success) {
        setPlaylists(res.data.playlists);
      }
    } catch (err) {
      console.error('Failed to load playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setCreating(true);
      const res = await playlistAPI.createPlaylist({
        name: name.trim(),
        description: description.trim(),
        isPublic,
      });
      if (res.data.success) {
        setPlaylists((prev) => [res.data.playlist, ...prev]);
        setName('');
        setDescription('');
        setShowCreateModal(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create playlist');
    } finally {
      setCreating(false);
    }
  };

  const handlePlayPlaylist = (playlist, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (playlist.songs && playlist.songs.length > 0) {
      playSong(playlist.songs[0], playlist.songs);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Playlists</h1>
          <p className="text-xs text-obsidian-400">
            Curate and stream collections of audio files hosted on AWS S3
          </p>
        </div>

        {user && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-neonGreen to-emerald-400 text-obsidian-950 font-bold text-xs shadow-neon-green hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Playlist
          </button>
        )}
      </div>

      {/* Playlist Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 rounded-2xl bg-obsidian-850 animate-pulse border border-obsidian-800"></div>
          ))}
        </div>
      ) : playlists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {playlists.map((playlist) => (
            <Link
              key={playlist._id}
              to={`/playlists/${playlist._id}`}
              className="group relative p-5 rounded-2xl bg-obsidian-850/80 hover:bg-obsidian-800 border border-obsidian-800 hover:border-neonPurple/50 hover:shadow-neon-purple transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neonPurple/20 to-neonGreen/10 border border-neonPurple/30 flex items-center justify-center text-neonPurple group-hover:scale-105 transition-transform">
                    <Music2 className="w-6 h-6" />
                  </div>

                  {playlist.songs?.length > 0 && (
                    <button
                      onClick={(e) => handlePlayPlaylist(playlist, e)}
                      title="Play Playlist"
                      className="w-10 h-10 rounded-full bg-neonGreen text-obsidian-950 flex items-center justify-center shadow-neon-green hover:scale-110 active:scale-95 transition-transform"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                  )}
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-neonGreen transition-colors truncate">
                  {playlist.name}
                </h3>
                <p className="text-xs text-obsidian-400 line-clamp-2 mt-1">
                  {playlist.description || 'Curated music playlist from AWS S3 storage.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-obsidian-800 text-[11px] font-mono text-obsidian-400">
                <span>{playlist.songs?.length || 0} Tracks</span>
                <span className="flex items-center gap-1 text-neonPurple">
                  <Globe className="w-3 h-3" />
                  Public
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-obsidian-900 border border-obsidian-800 text-center text-obsidian-400">
          <ListMusic className="w-12 h-12 mx-auto mb-3 text-obsidian-600" />
          <h3 className="text-base font-semibold text-white">No playlists yet</h3>
          <p className="text-xs mt-1">Create your first playlist and group your favorite S3 tracks.</p>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-obsidian-900 border border-obsidian-750 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-white mb-1">Create New Playlist</h3>
            <p className="text-xs text-obsidian-400 mb-5">
              Organize your audio tracks stored in AWS S3
            </p>

            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-obsidian-300 mb-1">Playlist Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midnight Cyber Synth"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-obsidian-800 text-white text-sm focus:outline-none focus:border-neonGreen"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-obsidian-300 mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe the vibes of this playlist..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-obsidian-800 text-white text-sm focus:outline-none focus:border-neonGreen"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded bg-obsidian-850 border-obsidian-700 text-neonGreen focus:ring-0"
                />
                <label htmlFor="isPublic" className="text-xs text-obsidian-300">
                  Make playlist public to all listeners
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-obsidian-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-neonGreen text-obsidian-950 font-bold text-xs shadow-neon-green hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Playlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

