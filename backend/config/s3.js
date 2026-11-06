const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const region = process.env.AWS_REGION || 'us-east-1';
const bucketName = process.env.AWS_S3_BUCKET || 'cloudbeats-music-storage';

// S3Client configuration
// Follows AWS SDK standard credential provider chain:
// 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
// 2. Shared credentials file (~/.aws/credentials)
// 3. IAM Role for Amazon EC2 or ECS / EKS if running in AWS
const s3Config = {
  region: region,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
};

// If custom endpoint is supplied (e.g. MinIO, LocalStack, or custom S3 proxy)
if (process.env.AWS_ENDPOINT) {
  s3Config.endpoint = process.env.AWS_ENDPOINT;
  s3Config.forcePathStyle = true;
}

// If explicit credentials exist in environment variables (for local dev)
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {})
  };
}

const s3Client = new S3Client(s3Config);

/**
 * Generate a presigned PUT URL for direct browser-to-S3 upload
 * @param {string} key - S3 object key (e.g., 'music/xyz.mp3' or 'covers/xyz.jpg')
 * @param {string} contentType - MIME type of the file
 * @param {number} expiresIn - Expiry time in seconds (default: 300s / 5 mins)
 * @returns {Promise<string>} Presigned URL
 */
const generatePresignedUploadUrl = async (key, contentType, expiresIn = 300) => {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Generate a presigned GET URL for secure streaming or image viewing
 * Supports HTTP Range requests for seeking in audio files
 * @param {string} key - S3 object key
 * @param {number} expiresIn - Expiry time in seconds (default: 3600s / 1 hour)
 * @returns {Promise<string>} Presigned URL
 */
const generatePresignedGetUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Verify whether an object exists in the S3 bucket using HeadObject
 * @param {string} key - S3 object key
 * @returns {Promise<{ exists: boolean, size?: number, contentType?: string }>}
 */
const checkS3ObjectExists = async (key) => {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    const response = await s3Client.send(command);
    return {
      exists: true,
      size: response.ContentLength,
      contentType: response.ContentType,
      lastModified: response.LastModified
    };
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return { exists: false };
    }
    // Re-throw if it's an authorization or network error
    throw error;
  }
};

/**
 * Delete an object from S3
 * @param {string} key - S3 object key
 * @returns {Promise<boolean>}
 */
const deleteS3Object = async (key) => {
  if (!key) return false;
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error(`[AWS S3] Error deleting object ${key}:`, error.message);
    throw error;
  }
};

module.exports = {
  s3Client,
  bucketName,
  region,
  generatePresignedUploadUrl,
  generatePresignedGetUrl,
  checkS3ObjectExists,
  deleteS3Object,
};

