import React, { useEffect, useState } from 'react';
import { Sparkles, Play, Disc3, ShieldCheck, Cloud, Flame, Clock } from 'lucide-react';
import { songAPI } from '../services/api';
import { SongCard } from '../components/SongCard';
import { SongRow } from '../components/SongRow';
import { usePlayer } from '../context/PlayerContext';

export const Dashboard = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const { playSong } = usePlayer();

  const genres = ['All', 'Electronic', 'Synthwave', 'Lo-Fi Chill', 'Pop', 'Rock', 'Hip-Hop'];

  useEffect(() => {
    fetchSongs();
  }, [selectedGenre]);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedGenre !== 'All') {
        params.genre = selectedGenre;
      }
      const res = await songAPI.getSongs(params);
      if (res.data.success) {
        setSongs(res.data.songs);
      }
    } catch (err) {
      console.error('Failed to load songs:', err);
    } finally {
      setLoading(false);
    }
  };

  const trendingSongs = [...songs].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 4);
  const recentSongs = [...songs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner with Obsidian Green & Purple Gradient Glow */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-obsidian-900 via-obsidian-850 to-obsidian-900 border border-obsidian-800 p-8 lg:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-neonGreen/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-96 h-96 bg-neonPurple/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neonGreen/10 border border-neonGreen/30 text-neonGreen text-xs font-mono font-semibold">
            <Cloud className="w-3.5 h-3.5" />
            <span>AWS S3 CLOUD AUDIO INFRASTRUCTURE</span>
          </div>

          <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Stream Pure Sound <br />
            <span className="bg-gradient-to-r from-neonGreen via-emerald-400 to-neonPurple bg-clip-text text-transparent">
              Zero Buffering, Direct from AWS S3
            </span>
          </h1>

          <p className="text-sm lg:text-base text-obsidian-200 max-w-xl">
            CloudBeats leverages AWS S3 private object storage, time-limited presigned URLs, and native HTTP Range headers for instantaneous scrubbing and pristine audio playback.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            {songs.length > 0 && (
              <button
                onClick={() => playSong(songs[0], songs)}
                className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-gradient-to-r from-neonGreen to-emerald-400 text-obsidian-950 font-bold text-sm shadow-neon-green hover:scale-105 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                Play All Tracks
              </button>
            )}

            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-obsidian-950/80 border border-obsidian-800 text-xs font-mono text-obsidian-300">
              <ShieldCheck className="w-4 h-4 text-neonGreen" />
              <span>Private S3 Bucket • 0% Public Access</span>
            </div>
          </div>
        </div>
      </section>

      {/* Genre Filter Chips */}
      <section className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedGenre === genre
                ? 'bg-neonGreen text-obsidian-950 shadow-neon-green scale-105'
                : 'bg-obsidian-850 hover:bg-obsidian-800 text-obsidian-300 border border-obsidian-800'
            }`}
          >
            {genre}
          </button>
        ))}
      </section>

      {/* Trending Songs Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-neonGreen" />
            <h2 className="text-xl font-bold text-white tracking-tight">Trending Songs</h2>
          </div>
          <span className="text-xs font-mono text-obsidian-400">AWS S3 Presigned GET Streaming</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-64 rounded-2xl bg-obsidian-850 animate-pulse border border-obsidian-800"></div>
            ))}
          </div>
        ) : trendingSongs.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {trendingSongs.map((song) => (
              <SongCard key={song._id} song={song} playlist={trendingSongs} />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-obsidian-900 border border-obsidian-800 text-center text-obsidian-400">
            <Disc3 className="w-10 h-10 mx-auto mb-2 text-obsidian-600 animate-spin" />
            <p className="text-sm">No songs found in the S3 bucket yet.</p>
          </div>
        )}
      </section>

      {/* Recently Played / Uploaded Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-neonPurple" />
            <h2 className="text-xl font-bold text-white tracking-tight">Recently Added Tracks</h2>
          </div>
          <span className="text-xs font-mono text-neonPurple">{recentSongs.length} Tracks Ready</span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-14 rounded-xl bg-obsidian-850 animate-pulse border border-obsidian-800"></div>
            ))}
          </div>
        ) : recentSongs.length > 0 ? (
          <div className="space-y-1.5">
            {recentSongs.map((song, index) => (
              <SongRow key={song._id} song={song} index={index} playlist={recentSongs} />
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-obsidian-900 border border-obsidian-800 text-center text-obsidian-400 text-sm">
            No audio tracks uploaded yet.
          </div>
        )}
      </section>
    </div>
  );
};

