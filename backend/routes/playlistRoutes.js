const express = require('express');
const router = express.Router();
const {
  getPlaylists,
  getPlaylistById,
  createPlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
} = require('../controllers/playlistController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getPlaylists);
router.get('/:id', getPlaylistById);
router.post('/', protect, createPlaylist);
router.post('/:id/songs', protect, addSongToPlaylist);
router.delete('/:id/songs/:songId', protect, removeSongFromPlaylist);

module.exports = router;

