import axios from 'axios';
import { uploadAPI } from './api';

const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.aac', '.ogg'];
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const MAX_AUDIO_BYTES = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Validate audio file format and size
 */
export const validateAudioFile = (file) => {
  if (!file) return { valid: false, error: 'Please select an audio file.' };

  const ext = '.' + file.name.split('.').pop().toLowerCase();
  const isAllowedExt = ALLOWED_AUDIO_EXTENSIONS.includes(ext);
  const isAllowedMime = file.type.startsWith('audio/') || file.type === 'video/mp4'; // Some m4a files report video/mp4

  if (!isAllowedExt && !isAllowedMime) {
    return {
      valid: false,
      error: `Unsupported audio format "${ext}". Supported: MP3, WAV, M4A, AAC.`,
    };
  }

  if (file.size > MAX_AUDIO_BYTES) {
    return {
      valid: false,
      error: `Audio file is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed is 50MB.`,
    };
  }

  return { valid: true };
};

/**
 * Validate image file format and size
 */
export const validateImageFile = (file) => {
  if (!file) return { valid: false, error: 'Please select an image file.' };

  const ext = '.' + file.name.split('.').pop().toLowerCase();
  const isAllowedExt = ALLOWED_IMAGE_EXTENSIONS.includes(ext);
  const isAllowedMime = file.type.startsWith('image/');

  if (!isAllowedExt || !isAllowedMime) {
    return {
      valid: false,
      error: `Unsupported image format "${ext}". Supported: JPG, JPEG, PNG, WEBP.`,
    };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return {
      valid: false,
      error: `Image file is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed is 10MB.`,
    };
  }

  return { valid: true };
};

/**
 * Extract audio duration in seconds from local audio file in browser
 */
export const getAudioDuration = (file) => {
  return new Promise((resolve) => {
    try {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      audio.src = objectUrl;

      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(Math.round(audio.duration) || 0);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(0);
      };
    } catch {
      resolve(0);
    }
  });
};

/**
 * Upload a file directly to AWS S3 using a Presigned PUT URL
 * @param {File} file - Browser File object
 * @param {'audio' | 'cover'} uploadType
 * @param {Function} onProgress - Callback with percentage (0 to 100)
 * @param {AbortSignal} signal - Optional abort signal to cancel upload
 * @returns {Promise<{ objectKey: string, uploadUrl: string }>}
 */
export const uploadFileToS3 = async (file, uploadType, onProgress, signal) => {
  // 1. Request presigned upload URL from backend
  const presignedRes = await uploadAPI.getPresignedUrl({
    filename: file.name,
    fileType: file.type || (uploadType === 'audio' ? 'audio/mpeg' : 'image/jpeg'),
    fileSize: file.size,
    uploadType,
  });

  const { uploadUrl, objectKey, headers } = presignedRes.data;
  const uploadContentType =
    headers?.['Content-Type'] ||
    file.type ||
    (uploadType === 'audio' ? 'audio/mpeg' : 'image/jpeg');

  // 2. Perform direct browser-to-S3 PUT upload
  // Notice: We don't send Authorization Bearer to S3; the presigned query params authenticate the request.
  await axios.put(uploadUrl, file, {
    headers: {
      'Content-Type': uploadContentType,
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        if (onProgress) {
          onProgress(percentCompleted);
        }
      }
    },
    signal,
  });

  return { objectKey, uploadUrl };
};

