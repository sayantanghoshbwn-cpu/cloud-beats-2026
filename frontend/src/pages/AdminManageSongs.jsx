import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Search,
  Trash2,
  Edit,
  UploadCloud,
  FileAudio,
  Disc3,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
} from 'lucide-react';
import { songAPI } from '../services/api';
import { SongRow } from '../components/SongRow';

export const AdminManageSongs = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Editing state
  const [editingSong, setEditingSong] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editAlbum, setEditAlbum] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [updating, setUpdating] = useState(false);

  // Deleting state
  const [deletingSong, setDeletingSong] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification
  const [notification, setNotification] = useState('');

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const res = await songAPI.getSongs();
      if (res.data.success) {
        setSongs(res.data.songs);
      }
    } catch (err) {
      console.error('Failed to load songs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (song) => {
    setEditingSong(song);
    setEditTitle(song.title);
    setEditArtist(song.artist);
    setEditAlbum(song.album || '');
    setEditGenre(song.genre || 'Electronic');
  };

  // Submit Edit Metadata
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingSong) return;

    try {
      setUpdating(true);
      const res = await songAPI.updateSong(editingSong._id, {
        title: editTitle,
        artist: editArtist,
        album: editAlbum,
        genre: editGenre,
      });

      if (res.data.success) {
        setSongs((prev) =>
          prev.map((s) => (s._id === editingSong._id ? { ...s, ...res.data.song } : s))
        );
        setNotification('Song metadata updated successfully.');
        setEditingSong(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update song.');
    } finally {
      setUpdating(false);
    }
  };

  // Confirm and Execute Delete (deletes from S3 and MongoDB)
  const handleConfirmDelete = async () => {
    if (!deletingSong) return;

    try {
      setIsDeleting(true);
      const res = await songAPI.deleteSong(deletingSong._id);

      if (res.data.success) {
        setSongs((prev) => prev.filter((s) => s._id !== deletingSong._id));
        setNotification(`Deleted track and purged S3 objects (${deletingSong.audioKey}).`);
        setDeletingSong(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete song.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSongs = songs.filter(
    (s) =>
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.artist?.toLowerCase().includes(search.toLowerCase()) ||
      s.album?.toLowerCase().includes(search.toLowerCase()) ||
      s.genre?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neonPurple/15 border border-neonPurple/30 text-neonPurple text-xs font-mono font-semibold mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>S3 MUSIC ASSET MANAGER</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Manage S3 Music Catalog
          </h1>
          <p className="text-xs text-obsidian-400">
            Audit S3 object keys, modify metadata, and delete audio & cover objects
          </p>
        </div>

        <Link
          to="/admin/upload"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neonGreen text-obsidian-950 font-bold text-xs shadow-neon-green hover:scale-105 transition-all self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          Upload New Track
        </Link>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-neonGreen/10 border border-neonGreen/30 text-neonGreen text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification('')} className="p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-obsidian-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter songs by title, artist, album, genre, or key..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-obsidian-900 border border-obsidian-800 rounded-xl text-white text-xs focus:outline-none focus:border-neonPurple"
        />
      </div>

      {/* Songs Table / List */}
      <div className="rounded-2xl bg-obsidian-900 border border-obsidian-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-obsidian-800 flex items-center justify-between text-xs font-mono text-obsidian-400">
          <span>Active Tracks ({filteredSongs.length})</span>
          <span>AWS S3 Object Mapping</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-obsidian-400">
            <Disc3 className="w-8 h-8 text-neonPurple animate-spin mx-auto mb-2" />
            <p className="text-xs font-mono">Fetching catalog from MongoDB & AWS S3...</p>
          </div>
        ) : filteredSongs.length > 0 ? (
          <div className="divide-y divide-obsidian-800/60 p-2 space-y-1">
            {filteredSongs.map((song, index) => (
              <div
                key={song._id}
                className="p-3 rounded-xl bg-obsidian-850/40 hover:bg-obsidian-850 border border-transparent hover:border-obsidian-750 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Left: Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={song.coverUrl || '/default-cover.svg'}
                    alt=""
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/default-cover.svg';
                    }}
                    className="w-12 h-12 rounded-xl object-cover bg-obsidian-950 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{song.title}</p>
                    <p className="text-xs text-obsidian-400 truncate">
                      {song.artist} • {song.album || 'Single'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] font-mono">
                      <span className="text-neonGreen px-1.5 py-0.5 rounded bg-neonGreen/10 border border-neonGreen/20 truncate max-w-[200px]" title={song.audioKey}>
                        Audio: {song.audioKey}
                      </span>
                      {song.coverKey && (
                        <span className="text-neonPurple px-1.5 py-0.5 rounded bg-neonPurple/10 border border-neonPurple/20 truncate max-w-[180px]" title={song.coverKey}>
                          Cover: {song.coverKey}
                        </span>
                      )}
                      <span className="text-obsidian-400">
                        Plays: {song.plays || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => handleOpenEdit(song)}
                    className="px-3 py-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-750 text-white text-xs font-medium flex items-center gap-1.5 border border-obsidian-700 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5 text-neonGreen" />
                    Edit
                  </button>

                  <button
                    onClick={() => setDeletingSong(song)}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-1.5 border border-rose-500/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-obsidian-400">
            <FileAudio className="w-10 h-10 mx-auto mb-2 text-obsidian-600" />
            <p className="text-sm font-semibold text-white">No tracks match your query</p>
            <p className="text-xs mt-1">Upload a new track or modify your search terms.</p>
          </div>
        )}
      </div>

      {/* Edit Metadata Modal */}
      {editingSong && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-obsidian-900 border border-obsidian-750 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-obsidian-800">
              <h3 className="font-bold text-white text-base">Edit Song Metadata</h3>
              <button
                onClick={() => setEditingSong(null)}
                className="p-1 text-obsidian-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-mono text-obsidian-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-obsidian-950 border border-obsidian-800 text-white text-sm focus:outline-none focus:border-neonGreen"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-obsidian-300 mb-1">Artist</label>
                <input
                  type="text"
                  required
                  value={editArtist}
                  onChange={(e) => setEditArtist(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-obsidian-950 border border-obsidian-800 text-white text-sm focus:outline-none focus:border-neonGreen"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-obsidian-300 mb-1">Album</label>
                  <input
                    type="text"
                    value={editAlbum}
                    onChange={(e) => setEditAlbum(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-obsidian-950 border border-obsidian-800 text-white text-sm focus:outline-none focus:border-neonGreen"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-obsidian-300 mb-1">Genre</label>
                  <input
                    type="text"
                    value={editGenre}
                    onChange={(e) => setEditGenre(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-obsidian-950 border border-obsidian-800 text-white text-sm focus:outline-none focus:border-neonGreen"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingSong(null)}
                  className="px-4 py-2 rounded-xl text-xs text-obsidian-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-neonGreen text-obsidian-950 font-bold text-xs shadow-neon-green"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSong && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-obsidian-900 border border-rose-500/40 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-white text-base">Confirm Permanent S3 Deletion</h3>
            </div>

            <p className="text-xs text-obsidian-300">
              Are you sure you want to delete <strong className="text-white">"{deletingSong.title}"</strong>?
            </p>

            <div className="p-3 rounded-xl bg-obsidian-950 border border-obsidian-800 space-y-1 text-[11px] font-mono text-obsidian-400">
              <p className="text-rose-400 font-semibold">The following objects will be permanently purged from AWS S3:</p>
              <p>• {deletingSong.audioKey}</p>
              {deletingSong.coverKey && <p>• {deletingSong.coverKey}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSong(null)}
                className="px-4 py-2 rounded-xl text-xs text-obsidian-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Purging from S3...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

