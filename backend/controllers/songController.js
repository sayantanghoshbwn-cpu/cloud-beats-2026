const mongoose = require('mongoose');
const Song = require('../models/Song');
const { generatePresignedGetUrl, deleteS3Object } = require('../config/s3');

// In-memory cache for presigned GET URLs (avoids generating new URLs on every single request if still valid)
// Structure: { [key]: { url: string, expiresAt: number } }
const presignedUrlCache = new Map();

/**
 * Helper to get or create cached presigned GET URL
 * @param {string} key - S3 object key
 * @param {number} ttlSeconds - Time To Live (default: 3600s / 1 hour)
 */
const getCachedPresignedUrl = async (key, ttlSeconds = 3600) => {
  if (!key) return null;

  const now = Date.now();
  const cached = presignedUrlCache.get(key);

  // If cached and still has at least 5 minutes before expiry, reuse it
  if (cached && cached.expiresAt > now + 300000) {
    return cached.url;
  }

  try {
    const url = await generatePresignedGetUrl(key, ttlSeconds);
    presignedUrlCache.set(key, {
      url,
      expiresAt: now + (ttlSeconds * 1000),
    });
    return url;
  } catch (error) {
    console.error(`[S3 Presigned Cache Error] Failed to generate URL for ${key}:`, error.message);
    return null;
  }
};

// @desc    Get all songs with filtering, search, and pagination
// @route   GET /api/songs
// @access  Public
const getSongs = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        count: 0,
        total: 0,
        page: 1,
        pages: 1,
        songs: [],
        notice: 'Database is connecting...',
      });
    }

    const { search, genre, sort, limit = 50, page = 1 } = req.query;

    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { artist: { $regex: search, $options: 'i' } },
        { album: { $regex: search, $options: 'i' } },
        { genre: { $regex: search, $options: 'i' } },
      ];
    }

    // Genre filter
    if (genre && genre !== 'All') {
      query.genre = { $regex: `^${genre}$`, $options: 'i' };
    }

    // Sorting options
    let sortOptions = { createdAt: -1 }; // Default: newest first
    if (sort === 'trending' || sort === 'popular') {
      sortOptions = { plays: -1, createdAt: -1 };
    } else if (sort === 'title') {
      sortOptions = { title: 1 };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Song.countDocuments(query);
    const songs = await Song.find(query)
      .populate('uploadedBy', 'name email role')
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    // Enrich songs with presigned cover URLs
    const enrichedSongs = await Promise.all(
      songs.map(async (song) => {
        let coverUrl = null;
        if (song.coverKey) {
          coverUrl = await getCachedPresignedUrl(song.coverKey, 3600);
        }
        return {
          ...song.toObject(),
          coverUrl: coverUrl || null,
        };
      })
    );

    res.json({
      success: true,
      count: enrichedSongs.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
      songs: enrichedSongs,
    });
  } catch (error) {
    console.error('[Song Controller] Error fetching songs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve songs: ' + error.message,
    });
  }
};

// @desc    Get single song by ID
// @route   GET /api/songs/:id
// @access  Public
const getSongById = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id).populate('uploadedBy', 'name email role');
    if (!song) {
      return res.status(404).json({
        success: false,
        message: 'Song not found with ID: ' + req.params.id,
      });
    }

    let coverUrl = null;
    if (song.coverKey) {
      coverUrl = await getCachedPresignedUrl(song.coverKey, 3600);
    }

    res.json({
      success: true,
      song: {
        ...song.toObject(),
        coverUrl,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Generate secure Presigned GET URL for music streaming
// @route   GET /api/songs/:id/stream
// @access  Public
const streamSong = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({
        success: false,
        message: 'Song not found.',
      });
    }

    if (!song.audioKey) {
      return res.status(400).json({
        success: false,
        message: 'This song does not have an associated S3 audio file.',
      });
    }

    // Generate Presigned GET URL (1 hour validity = 3600 seconds)
    // Presigned S3 GET URLs natively support HTTP Range headers for audio scrubbing/seeking
    const streamUrl = await getCachedPresignedUrl(song.audioKey, 3600);

    if (!streamUrl) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate streaming URL from AWS S3.',
      });
    }

    // Increment play count asynchronously
    Song.findByIdAndUpdate(song._id, { $inc: { plays: 1 } }).catch((err) =>
      console.error('Failed to increment play count:', err.message)
    );

    // If client requested direct redirect (e.g. from <audio src="...">)
    if (req.query.redirect === 'true') {
      return res.redirect(307, streamUrl);
    }

    // Otherwise return JSON
    return res.status(200).json({
      success: true,
      songId: song._id,
      title: song.title,
      artist: song.artist,
      duration: song.duration,
      streamUrl,
      proxyStreamUrl: `/api/songs/${song._id}/stream-proxy`,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('[Stream Controller] Error streaming song:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate stream: ' + error.message,
    });
  }
};

// @desc    Direct S3 Audio Proxy Streaming with HTTP Range support (CORS-free backup)
// @route   GET /api/songs/:id/stream-proxy
// @access  Public
const streamSongProxy = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song || !song.audioKey) {
      return res.status(404).send('Song not found or missing S3 key.');
    }

    const { s3Client, bucketName } = require('../config/s3');
    const { GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

    // Fetch object metadata to get size and content-type
    const head = await s3Client.send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: song.audioKey,
      })
    );

    const totalSize = head.ContentLength;
    const contentType = head.ContentType || 'audio/mpeg';
    const range = req.headers.range;

    // Increment play count asynchronously
    Song.findByIdAndUpdate(song._id, { $inc: { plays: 1 } }).catch(() => {});

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
      const chunkSize = end - start + 1;

      const s3Stream = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: song.audioKey,
          Range: `bytes=${start}-${end}`,
        })
      );

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      });

      s3Stream.Body.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': totalSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      });

      const s3Stream = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: song.audioKey,
        })
      );

      s3Stream.Body.pipe(res);
    }
  } catch (err) {
    console.error('[Stream Proxy Error]:', err.message);
    res.status(500).send('Streaming error: ' + err.message);
  }
};

// @desc    Generate secure Presigned GET URL for cover image
// @route   GET /api/songs/:id/cover
// @access  Public
const getSongCover = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({
        success: false,
        message: 'Song not found.',
      });
    }

    if (!song.coverKey) {
      // Return default cover redirect or placeholder info
      if (req.query.redirect === 'true') {
        return res.redirect('/default-cover.png');
      }
      return res.json({
        success: true,
        coverUrl: '/default-cover.png',
      });
    }

    // Generate or fetch cached presigned URL
    const coverUrl = await getCachedPresignedUrl(song.coverKey, 3600);

    if (req.query.redirect === 'true' && coverUrl) {
      return res.redirect(307, coverUrl);
    }

    return res.json({
      success: true,
      coverUrl,
    });
  } catch (error) {
    console.error('[Cover Controller] Error retrieving cover:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cover: ' + error.message,
    });
  }
};

// @desc    Edit song metadata
// @route   PUT /api/songs/:id
// @access  Private / Admin
const updateSong = async (req, res) => {
  try {
    const { title, artist, album, genre, duration } = req.body;

    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({
        success: false,
        message: 'Song not found.',
      });
    }

    if (title) song.title = title.trim();
    if (artist) song.artist = artist.trim();
    if (album) song.album = album.trim();
    if (genre) song.genre = genre.trim();
    if (duration !== undefined) song.duration = Number(duration);

    const updatedSong = await song.save();

    res.json({
      success: true,
      message: 'Song metadata updated successfully.',
      song: updatedSong,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete song from S3 and MongoDB
// @route   DELETE /api/songs/:id
// @access  Private / Admin
const deleteSong = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({
        success: false,
        message: 'Song not found.',
      });
    }

    const { audioKey, coverKey } = song;

    // 1. Delete audio file from AWS S3
    if (audioKey) {
      try {
        await deleteS3Object(audioKey);
        presignedUrlCache.delete(audioKey);
      } catch (s3AudioErr) {
        console.warn(`[Delete Song] Warning: Failed to delete S3 audio ${audioKey}:`, s3AudioErr.message);
      }
    }

    // 2. Delete cover file from AWS S3
    if (coverKey) {
      try {
        await deleteS3Object(coverKey);
        presignedUrlCache.delete(coverKey);
      } catch (s3CoverErr) {
        console.warn(`[Delete Song] Warning: Failed to delete S3 cover ${coverKey}:`, s3CoverErr.message);
      }
    }

    // 3. Delete song record from MongoDB
    await Song.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: 'Song and associated AWS S3 objects deleted successfully.',
      deletedId: req.params.id,
    });
  } catch (error) {
    console.error('[Delete Song Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete song: ' + error.message,
    });
  }
};

module.exports = {
  getSongs,
  getSongById,
  streamSong,
  streamSongProxy,
  getSongCover,
  updateSong,
  deleteSong,
};

