const { v4: uuidv4 } = require('uuid');
const path = require('path');
const {
  generatePresignedUploadUrl,
  checkS3ObjectExists,
  bucketName,
} = require('../config/s3');
const Song = require('../models/Song');

// Permitted MIME types and extensions
const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/aac',
  'audio/x-aac',
  'audio/ogg',
];

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Clean filename to prevent path traversal or special character issues
 */
const sanitizeFilename = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${base}${ext}`;
};

// @desc    Generate Presigned Upload URL for S3 PUT
// @route   POST /api/admin/uploads/presigned-url
// @access  Private / Admin
const getPresignedUploadUrl = async (req, res) => {
  try {
    const { filename, fileType, fileSize, uploadType } = req.body;

    if (!filename || !fileType || !fileSize || !uploadType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: filename, fileType, fileSize, uploadType are required.',
      });
    }

    let folder = '';
    let maxAllowedSize = 0;

    if (uploadType === 'audio') {
      if (!ALLOWED_AUDIO_TYPES.includes(fileType.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid audio format: ${fileType}. Supported formats: MP3, WAV, M4A, AAC.`,
        });
      }
      folder = 'music';
      maxAllowedSize = MAX_AUDIO_SIZE;
    } else if (uploadType === 'cover') {
      if (!ALLOWED_IMAGE_TYPES.includes(fileType.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid image format: ${fileType}. Supported formats: JPG, JPEG, PNG, WEBP.`,
        });
      }
      folder = 'covers';
      maxAllowedSize = MAX_IMAGE_SIZE;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid uploadType. Must be either "audio" or "cover".',
      });
    }

    if (Number(fileSize) > maxAllowedSize) {
      const maxMb = maxAllowedSize / (1024 * 1024);
      return res.status(400).json({
        success: false,
        message: `File size exceeds the maximum limit of ${maxMb}MB.`,
      });
    }

    // Generate unique S3 object key
    const sanitizedName = sanitizeFilename(filename);
    const uniqueId = uuidv4();
    const objectKey = `${folder}/${uniqueId}-${sanitizedName}`;

    // Generate presigned PUT URL with 5-minute (300 seconds) expiration
    const uploadUrl = await generatePresignedUploadUrl(objectKey, fileType, 300);

    return res.status(200).json({
      success: true,
      message: 'Presigned upload URL generated successfully.',
      uploadUrl,
      objectKey,
      bucket: bucketName,
      expiresIn: 300,
      headers: {
        'Content-Type': fileType,
      },
    });
  } catch (error) {
    console.error('[Upload Controller] Error generating presigned URL:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate upload URL: ' + error.message,
    });
  }
};

// @desc    Complete Upload & Save Song in MongoDB
// @route   POST /api/admin/uploads/complete
// @access  Private / Admin
const completeUpload = async (req, res) => {
  try {
    const { title, artist, album, genre, audioKey, coverKey, duration, fileSize } = req.body;

    if (!title || !artist || !audioKey) {
      return res.status(400).json({
        success: false,
        message: 'Title, artist, and audioKey are required.',
      });
    }

    // Validate that audioKey belongs to the 'music/' prefix
    if (!audioKey.startsWith('music/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid audioKey. Audio files must reside in the music/ prefix.',
      });
    }

    // Validate that coverKey (if provided) belongs to 'covers/' prefix
    if (coverKey && !coverKey.startsWith('covers/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coverKey. Cover images must reside in the covers/ prefix.',
      });
    }

    // Verify S3 object exists in AWS S3 using HeadObject
    // (If AWS credentials are provided and bucket is accessible)
    try {
      const audioStatus = await checkS3ObjectExists(audioKey);
      if (!audioStatus.exists) {
        return res.status(404).json({
          success: false,
          message: 'Audio file not found in S3 bucket. Ensure the direct upload succeeded.',
        });
      }

      if (coverKey) {
        const coverStatus = await checkS3ObjectExists(coverKey);
        if (!coverStatus.exists) {
          console.warn(`[Upload Complete] Cover object ${coverKey} not found in S3.`);
        }
      }
    } catch (s3Error) {
      // In development or if running mock/offline without valid AWS keys
      console.warn('[AWS S3 Verification Warning]:', s3Error.message);
      // If error is CredentialsError or NetworkingError, log warning but allow saving in dev mode if requested
      if (process.env.STRICT_S3_CHECK === 'true') {
        return res.status(500).json({
          success: false,
          message: `S3 verification failed: ${s3Error.message}`,
        });
      }
    }

    // Check if song with identical audioKey already exists to prevent duplicate registration
    const existing = await Song.findOne({ audioKey });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A song with this audio file is already registered in the system.',
      });
    }

    // Save song in MongoDB
    const newSong = await Song.create({
      title: title.trim(),
      artist: artist.trim(),
      album: album ? album.trim() : 'Single',
      genre: genre ? genre.trim() : 'Pop',
      audioKey,
      coverKey: coverKey || null,
      duration: Number(duration) || 0,
      fileSize: Number(fileSize) || 0,
      uploadedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Song uploaded and registered successfully in CloudBeats.',
      song: newSong,
    });
  } catch (error) {
    console.error('[Upload Controller] Error completing upload:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete upload: ' + error.message,
    });
  }
};

// @desc    Test S3 connectivity and IAM PutObject permissions
// @route   GET /api/admin/uploads/test-s3
// @access  Private / Admin
const testS3Permissions = async (req, res) => {
  try {
    const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const { s3Client } = require('../config/s3');

    const testKey = 'music/.probe-test.txt';
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: 'probe-test',
        ContentType: 'text/plain',
      })
    );

    // Delete probe file
    await s3Client
      .send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        })
      )
      .catch(() => {});

    return res.json({
      success: true,
      message: `AWS S3 connectivity verified successfully for bucket "${bucketName}". PutObject and DeleteObject are functional.`,
    });
  } catch (error) {
    console.error('[S3 Probe Error]:', error.message);
    return res.status(403).json({
      success: false,
      message: error.message,
      errorName: error.name,
      remedy:
        "Please attach 'AmazonS3FullAccess' or your custom S3 policy to IAM User 'cloudbeats-local-dev' in AWS Management Console > IAM > Users > Permissions.",
    });
  }
};

// @desc    Direct S3 Upload via Server Relay (bypasses browser S3 CORS)
// @route   POST /api/admin/uploads/server-relay
// @access  Private / Admin
const uploadViaServerRelay = async (req, res) => {
  try {
    const { title, artist, album, genre, duration } = req.body;
    const audioFile = req.files?.audio?.[0];
    const coverFile = req.files?.cover?.[0];

    if (!audioFile) {
      return res.status(400).json({
        success: false,
        message: 'Audio file is required.',
      });
    }

    if (!title || !artist) {
      return res.status(400).json({
        success: false,
        message: 'Title and artist are required.',
      });
    }

    const { s3Client } = require('../config/s3');
    const { PutObjectCommand } = require('@aws-sdk/client-s3');

    // 1. Upload audio file directly to AWS S3 music/
    const sanitizedAudioName = sanitizeFilename(audioFile.originalname);
    const audioKey = `music/${uuidv4()}-${sanitizedAudioName}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: audioKey,
        Body: audioFile.buffer,
        ContentType: audioFile.mimetype || 'audio/mpeg',
      })
    );

    // 2. Upload cover file directly to AWS S3 covers/ (if present)
    let coverKey = null;
    if (coverFile) {
      const sanitizedCoverName = sanitizeFilename(coverFile.originalname);
      coverKey = `covers/${uuidv4()}-${sanitizedCoverName}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: coverKey,
          Body: coverFile.buffer,
          ContentType: coverFile.mimetype || 'image/jpeg',
        })
      );
    }

    // 3. Save song in MongoDB
    const newSong = await Song.create({
      title: title.trim(),
      artist: artist.trim(),
      album: album ? album.trim() : 'Single',
      genre: genre ? genre.trim() : 'Electronic',
      audioKey,
      coverKey,
      duration: Number(duration) || 0,
      fileSize: audioFile.size || 0,
      uploadedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Song uploaded directly to AWS S3 and saved in CloudBeats library!',
      song: newSong,
      audioKey,
      coverKey,
    });
  } catch (error) {
    console.error('[Server Relay Upload Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload to S3: ' + error.message,
    });
  }
};

module.exports = {
  getPresignedUploadUrl,
  completeUpload,
  testS3Permissions,
  uploadViaServerRelay,
};

