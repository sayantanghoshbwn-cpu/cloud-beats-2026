const Playlist = require('../models/Playlist');

// @desc    Get all public playlists or user's playlists
// @route   GET /api/playlists
// @access  Public
const getPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find({ isPublic: true })
      .populate('user', 'name')
      .populate('songs', 'title artist album duration coverKey');
    res.json({ success: true, playlists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single playlist by ID
// @route   GET /api/playlists/:id
// @access  Public
const getPlaylistById = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate('user', 'name')
      .populate('songs');
    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found.' });
    }
    res.json({ success: true, playlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new playlist
// @route   POST /api/playlists
// @access  Private
const createPlaylist = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Playlist name is required.' });
    }

    const playlist = await Playlist.create({
      name,
      description,
      isPublic: isPublic !== undefined ? isPublic : true,
      user: req.user._id,
      songs: [],
    });

    res.status(201).json({ success: true, playlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add song to playlist
// @route   POST /api/playlists/:id/songs
// @access  Private
const addSongToPlaylist = async (req, res) => {
  try {
    const { songId } = req.body;
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found.' });
    }

    if (playlist.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You can only edit your own playlist.' });
    }

    if (playlist.songs.includes(songId)) {
      return res.status(400).json({ success: false, message: 'Song already in playlist.' });
    }

    playlist.songs.push(songId);
    await playlist.save();

    res.json({ success: true, message: 'Song added to playlist.', playlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove song from playlist
// @route   DELETE /api/playlists/:id/songs/:songId
// @access  Private
const removeSongFromPlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found.' });
    }

    if (playlist.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to modify this playlist.' });
    }

    playlist.songs = playlist.songs.filter(
      (s) => s.toString() !== req.params.songId
    );
    await playlist.save();

    res.json({ success: true, message: 'Song removed from playlist.', playlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPlaylists,
  getPlaylistById,
  createPlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
};

