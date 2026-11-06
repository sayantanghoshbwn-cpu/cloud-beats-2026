const mongoose = require('mongoose');

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Song title is required'],
      trim: true,
      maxlength: 120,
    },
    artist: {
      type: String,
      required: [true, 'Artist name is required'],
      trim: true,
      maxlength: 120,
    },
    album: {
      type: String,
      default: 'Single',
      trim: true,
      maxlength: 120,
    },
    genre: {
      type: String,
      default: 'Pop',
      trim: true,
    },
    audioKey: {
      type: String,
      required: [true, 'S3 audio object key is required'],
      trim: true,
    },
    coverKey: {
      type: String,
      default: null,
      trim: true,
    },
    duration: {
      type: Number,
      default: 0, // Duration in seconds
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plays: {
      type: Number,
      default: 0,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: 'audio/mpeg',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast searching and sorting
songSchema.index({ title: 'text', artist: 'text', album: 'text', genre: 'text' });
songSchema.index({ plays: -1 });
songSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Song', songSchema);

