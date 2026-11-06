import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Music, Disc3, Filter, Radio } from 'lucide-react';
import { songAPI } from '../services/api';
import { SongCard } from '../components/SongCard';
import { SongRow } from '../components/SongRow';

export const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchSearchResults(query);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const fetchSearchResults = async (searchQuery) => {
    try {
      setLoading(true);
      const res = await songAPI.getSongs({ search: searchQuery });
      if (res.data.success) {
        setSongs(res.data.songs);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSearchParams(val ? { q: val } : {});
  };

  const quickTags = ['Synthwave', 'Electronic', 'Lo-Fi Chill', 'Pop', 'Midnight', 'Horizon'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Big Search Bar */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Search CloudBeats</h1>
          <p className="text-xs text-obsidian-400">
            Query indexed metadata across your entire AWS S3 audio library
          </p>
        </div>

        <div className="relative">
          <SearchIcon className="w-5 h-5 text-neonGreen absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by song title, artist, album, or genre..."
            value={query}
            onChange={handleSearchChange}
            className="w-full pl-12 pr-4 py-3.5 bg-obsidian-900 border border-obsidian-800 rounded-2xl focus:outline-none focus:border-neonGreen/60 focus:ring-1 focus:ring-neonGreen/40 text-white placeholder-obsidian-400 text-sm shadow-xl transition-all"
          />
        </div>

        {/* Quick Tag Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-mono text-obsidian-400 mr-1">Suggestions:</span>
          {quickTags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setQuery(tag);
                setSearchParams({ q: tag });
              }}
              className="px-3 py-1 rounded-full text-xs font-medium bg-obsidian-850 hover:bg-obsidian-800 border border-obsidian-800 text-obsidian-300 hover:text-white transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between pt-2 border-t border-obsidian-800">
        <span className="text-xs font-mono text-obsidian-400">
          {loading ? 'Searching S3 registry...' : `Found ${songs.length} song${songs.length === 1 ? '' : 's'}`}
        </span>

        <div className="flex items-center gap-1 bg-obsidian-900 p-1 rounded-xl border border-obsidian-800">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'list' ? 'bg-neonGreen text-obsidian-950 font-bold' : 'text-obsidian-400'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'grid' ? 'bg-neonPurple text-white font-bold' : 'text-obsidian-400'
            }`}
          >
            Grid
          </button>
        </div>
      </div>

      {/* Results Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-obsidian-400">
          <Disc3 className="w-8 h-8 text-neonGreen animate-spin mb-3" />
          <p className="text-xs font-mono">Querying S3 songs...</p>
        </div>
      ) : songs.length > 0 ? (
        viewMode === 'list' ? (
          <div className="space-y-1.5">
            {songs.map((song, index) => (
              <SongRow key={song._id} song={song} index={index} playlist={songs} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {songs.map((song) => (
              <SongCard key={song._id} song={song} playlist={songs} />
            ))}
          </div>
        )
      ) : (
        <div className="p-12 rounded-2xl bg-obsidian-900/60 border border-obsidian-800 text-center text-obsidian-400">
          <Music className="w-12 h-12 mx-auto mb-3 text-obsidian-600" />
          <h3 className="text-base font-semibold text-white">No tracks found</h3>
          <p className="text-xs mt-1">Try searching for a different keyword or genre.</p>
        </div>
      )}
    </div>
  );
};

