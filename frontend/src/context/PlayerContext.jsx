import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { songAPI } from '../services/api';

const PlayerContext = createContext(null);

export const PlayerProvider = ({ children }) => {
  const audioRef = useRef(new Audio());
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [streamError, setStreamError] = useState(null);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);

  // In-memory cache for presigned stream URLs: { [songId]: { url, expiresAt } }
  const streamCacheRef = useRef(new Map());

  // Attach audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || currentSong?.duration || 0);
    };

    const handleEnded = () => {
      playNext();
    };

    const handleAudioError = (e) => {
      console.error('[Audio Element Error]', e);
      setIsPlaying(false);
      setIsLoadingStream(false);
      setStreamError('Failed to stream audio file from AWS S3.');
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleAudioError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleAudioError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [queueIndex, queue]);

  // Fetch or retrieve cached S3 presigned stream URL
  const fetchStreamUrl = async (songId) => {
    const now = Date.now();
    const cached = streamCacheRef.current.get(songId);

    // Reuse if cached and not expiring within 5 minutes
    if (cached && cached.expiresAt > now + 300000) {
      return cached.url;
    }

    const res = await songAPI.getStreamUrl(songId);
    if (res.data.success && res.data.streamUrl) {
      const url = res.data.streamUrl;
      streamCacheRef.current.set(songId, {
        url,
        expiresAt: now + (res.data.expiresIn || 3600) * 1000,
      });
      return url;
    }
    throw new Error(res.data.message || 'Could not retrieve stream URL from S3');
  };

  /**
   * Play a song with optional new queue list
   */
  const playSong = async (song, newQueue = null) => {
    if (!song) return;

    try {
      setStreamError(null);
      setIsLoadingStream(true);

      if (newQueue) {
        setQueue(newQueue);
        const idx = newQueue.findIndex((s) => s._id === song._id);
        setQueueIndex(idx !== -1 ? idx : 0);
      } else {
        // If song is not in current queue, append it
        const existingIdx = queue.findIndex((s) => s._id === song._id);
        if (existingIdx === -1) {
          setQueue((prev) => [...prev, song]);
          setQueueIndex(queue.length);
        } else {
          setQueueIndex(existingIdx);
        }
      }

      setCurrentSong(song);
      const audio = audioRef.current;

      // 1. Get presigned GET streaming URL (with automatic proxy fallback)
      let streamUrl;
      try {
        streamUrl = await fetchStreamUrl(song._id);
      } catch (fetchErr) {
        console.warn('[Player] Presigned S3 URL retrieval failed, falling back to proxy stream:', fetchErr.message);
        streamUrl = `/api/songs/${song._id}/stream-proxy`;
      }

      // 2. Set src on audio element
      if (audio.src !== streamUrl) {
        audio.src = streamUrl;
        audio.load();
      }

      // 3. Play audio with auto-fallback to proxy stream if S3 stream URL is blocked
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (playErr) {
        console.warn('[Player] Playback on direct S3 URL failed. Falling back to S3 stream proxy...', playErr.message);
        const fallbackUrl = `/api/songs/${song._id}/stream-proxy`;
        if (audio.src !== fallbackUrl) {
          audio.src = fallbackUrl;
          audio.load();
          await audio.play();
          setIsPlaying(true);
        }
      }
    } catch (err) {
      console.error('[Playback error]', err);
      setStreamError(err.message || 'Error streaming music from AWS S3');
      setIsPlaying(false);
    } finally {
      setIsLoadingStream(false);
    }
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!currentSong) {
      if (queue.length > 0) {
        playSong(queue[0]);
      }
      return;
    }

    if (isPlaying) {
      audio.pause();
    } else {
      try {
        await audio.play();
      } catch (err) {
        // If playback failed (e.g. presigned URL expired), re-fetch and play
        console.warn('Playback error on toggle play, refreshing presigned URL...', err.message);
        playSong(currentSong);
      }
    }
  };

  const seek = (newTime) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (newVol) => {
    const vol = Math.max(0, Math.min(1, newVol));
    setVolume(vol);
    audioRef.current.volume = vol;
    if (vol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const playNext = () => {
    if (queue.length === 0) return;
    const nextIdx = (queueIndex + 1) % queue.length;
    setQueueIndex(nextIdx);
    playSong(queue[nextIdx]);
  };

  const playPrev = () => {
    if (queue.length === 0) return;
    const prevIdx = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prevIdx);
    playSong(queue[prevIdx]);
  };

  const addToQueue = (song) => {
    setQueue((prev) => [...prev, song]);
  };

  const toggleNowPlaying = () => {
    setIsNowPlayingOpen((prev) => !prev);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        isLoadingStream,
        currentTime,
        duration,
        volume,
        isMuted,
        queue,
        queueIndex,
        streamError,
        isNowPlayingOpen,
        playSong,
        togglePlay,
        seek,
        setVolume: handleVolumeChange,
        toggleMute,
        playNext,
        playPrev,
        addToQueue,
        toggleNowPlaying,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

