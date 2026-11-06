const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getPresignedUploadUrl,
  completeUpload,
  testS3Permissions,
  uploadViaServerRelay,
} = require('../controllers/uploadController');
const { protect, admin } = require('../middleware/authMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Routes mounted at /api/admin/uploads
router.get('/test-s3', protect, admin, testS3Permissions);
router.post('/presigned-url', protect, admin, getPresignedUploadUrl);
router.post('/complete', protect, admin, completeUpload);

// Server relay S3 upload (automatic fallback when browser S3 CORS is blocked)
router.post(
  '/server-relay',
  protect,
  admin,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  uploadViaServerRelay
);

module.exports = router;

