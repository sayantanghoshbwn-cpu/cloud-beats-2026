const express = require('express');
const router = express.Router();
const {
  getSongs,
  getSongById,
  streamSong,
  streamSongProxy,
  getSongCover,
  updateSong,
  deleteSong,
} = require('../controllers/songController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public endpoints
router.get('/', getSongs);
router.get('/:id', getSongById);
router.get('/:id/stream', streamSong);
router.get('/:id/stream-proxy', streamSongProxy);
router.get('/:id/cover', getSongCover);

// Admin-only endpoints
router.put('/:id', protect, admin, updateSong);
router.delete('/:id', protect, admin, deleteSong);

module.exports = router;

