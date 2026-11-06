import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UploadCloud,
  FileAudio,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  ArrowRight,
  ShieldAlert,
  Loader2,
  HardDrive,
} from 'lucide-react';
import { uploadAPI } from '../services/api';
import {
  validateAudioFile,
  validateImageFile,
  getAudioDuration,
  uploadFileToS3,
} from '../services/s3UploadService';

export const AdminUpload = () => {
  // Form fields
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('Electronic');

  // File states
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [duration, setDuration] = useState(0);

  // Upload progress & state
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [audioProgress, setAudioProgress] = useState(0);
  const [coverProgress, setCoverProgress] = useState(0);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [s3Testing, setS3Testing] = useState(false);
  const [s3TestResult, setS3TestResult] = useState(null);
  const [uploadMode, setUploadMode] = useState('auto'); // 'auto' | 'direct' | 'relay'

  const abortControllerRef = useRef(null);
  const navigate = useNavigate();

  const updateAudioProgress = (val) => {
    if (typeof val === 'number') {
      setAudioProgress(Math.min(100, Math.max(0, Math.round(val))));
    } else if (val && typeof val === 'object' && val.total) {
      const pct = Math.round((val.loaded * 100) / val.total);
      setAudioProgress(Math.min(100, Math.max(0, pct)));
    } else {
      setAudioProgress(0);
    }
  };

  const updateCoverProgress = (val) => {
    if (typeof val === 'number') {
      setCoverProgress(Math.min(100, Math.max(0, Math.round(val))));
    } else if (val && typeof val === 'object' && val.total) {
      const pct = Math.round((val.loaded * 100) / val.total);
      setCoverProgress(Math.min(100, Math.max(0, pct)));
    } else {
      setCoverProgress(0);
    }
  };

  const resetForm = () => {
    setTitle('');
    setArtist('');
    setAlbum('');
    setAudioFile(null);
    setCoverFile(null);
    setCoverPreview(null);
  };

  const handleTestS3 = async () => {
    try {
      setS3Testing(true);
      setS3TestResult(null);
      const res = await uploadAPI.testS3();
      setS3TestResult({ success: true, message: res.data.message });
    } catch (err) {
      setS3TestResult({
        success: false,
        message: err.response?.data?.message || err.message,
        remedy: err.response?.data?.remedy,
      });
    } finally {
      setS3Testing(false);
    }
  };

  const genres = [
    'Electronic',
    'Synthwave',
    'Lo-Fi Chill',
    'Pop',
    'Rock',
    'Hip-Hop',
    'Ambient',
    'Jazz',
    'Classical',
    'R&B',
  ];

  // Handle Audio File Selection
  const handleAudioSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      setError(validation.error);
      e.target.value = null;
      return;
    }

    setAudioFile(file);

    // Extract title if empty
    if (!title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
    }

    // Extract duration from browser audio object
    const dur = await getAudioDuration(file);
    setDuration(dur);
  };

  // Handle Cover Image Selection
  const handleCoverSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      e.target.value = null;
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  // Cancel Upload Flow
  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setUploading(false);
      setCurrentStep('');
      setError('Upload was cancelled by user.');
    }
  };

  // Submit & Execute Multi-step Direct S3 Upload
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessData(null);

    if (!audioFile) {
      setError('Please select an audio file (MP3, WAV, M4A, or AAC).');
      return;
    }

    if (!title.trim() || !artist.trim()) {
      setError('Song title and artist name are required.');
      return;
    }

    setUploading(true);
    setAudioProgress(0);
    setCoverProgress(0);
    abortControllerRef.current = new AbortController();

    try {
      let useRelay = uploadMode === 'relay';

      if (!useRelay) {
        try {
          // STEP 1: Direct Browser-to-S3 Audio Upload
          setCurrentStep('Requesting S3 Presigned URL & uploading audio directly to S3 music/ ...');
          const audioResult = await uploadFileToS3(
            audioFile,
            'audio',
            updateAudioProgress,
            abortControllerRef.current.signal
          );
          const audioKey = audioResult.objectKey;

          // STEP 2: Direct Browser-to-S3 Cover Upload (if selected)
          let coverKey = null;
          if (coverFile) {
            setCurrentStep('Requesting S3 Presigned URL & uploading cover artwork to S3 covers/ ...');
            const coverResult = await uploadFileToS3(
              coverFile,
              'cover',
              updateCoverProgress,
              abortControllerRef.current.signal
            );
            coverKey = coverResult.objectKey;
          }

          // STEP 3: Complete & Register Metadata in MongoDB
          setCurrentStep('Validating S3 objects & saving metadata in MongoDB...');
          const completeRes = await uploadAPI.completeUpload({
            title: title.trim(),
            artist: artist.trim(),
            album: album.trim() || 'Single',
            genre: genre.trim(),
            audioKey,
            coverKey,
            duration,
            fileSize: audioFile.size,
          });

          if (completeRes.data.success) {
            setSuccessData({
              song: completeRes.data.song,
              audioKey,
              coverKey,
              method: 'Direct Browser-to-S3',
            });
            resetForm();
            return;
          }
        } catch (directErr) {
          console.warn('[Direct S3 Upload Notice]', directErr);
          const isCorsOrBlocked =
            directErr.message === 'Network Error' ||
            directErr.code === 'ERR_NETWORK' ||
            directErr.response?.status === 403 ||
            directErr.status === 403;

          if (isCorsOrBlocked && uploadMode === 'auto') {
            console.log('[Auto-Fallback] Browser S3 CORS blocked. Seamlessly falling back to S3 Relay...');
            useRelay = true;
          } else {
            throw directErr;
          }
        }
      }

      if (useRelay) {
        setCurrentStep('Uploading directly to AWS S3 via Backend Relay (bypasses browser CORS)...');
        setAudioProgress(20);
        const formData = new FormData();
        formData.append('audio', audioFile);
        if (coverFile) formData.append('cover', coverFile);
        formData.append('title', title.trim());
        formData.append('artist', artist.trim());
        formData.append('album', album.trim() || 'Single');
        formData.append('genre', genre.trim());
        formData.append('duration', duration);

        const relayRes = await uploadAPI.uploadServerRelay(
          formData,
          updateAudioProgress,
          abortControllerRef.current.signal
        );

        if (relayRes.data.success) {
          setSuccessData({
            song: relayRes.data.song,
            audioKey: relayRes.data.audioKey,
            coverKey: relayRes.data.coverKey,
            method: 'AWS S3 via Server Relay (CORS Bypass)',
          });
          resetForm();
          return;
        }
      }
    } catch (err) {
      console.error('Upload flow error:', err);
      if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        setError(
          "AWS S3 CORS Blocked: S3 rejected the browser preflight check. Please add CORS rules to your bucket in AWS S3 Console, or switch Upload Mode to 'S3 Server Relay'."
        );
      } else if (err.response?.status === 403 || err.status === 403) {
        setError(
          "AWS S3 403 Forbidden: S3 rejected the direct upload because your IAM User 'cloudbeats-local-dev' does not have 's3:PutObject' permission on bucket 'cloudbeats-music-storage'."
        );
      } else {
        setError(
          err.response?.data?.message || err.message || 'An error occurred during S3 upload.'
        );
      }
    } finally {
      setUploading(false);
      setCurrentStep('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neonGreen/10 border border-neonGreen/30 text-neonGreen text-xs font-mono font-semibold mb-1">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>DIRECT BROWSER-TO-S3 UPLOAD</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Upload Music to AWS S3
          </h1>
          <p className="text-xs text-obsidian-400">
            Files stream directly to your private S3 bucket without bottlenecking the backend
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestS3}
            disabled={s3Testing}
            className="px-3.5 py-2 rounded-xl bg-neonPurple/15 hover:bg-neonPurple/25 text-neonPurple text-xs font-semibold border border-neonPurple/30 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {s3Testing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Testing S3...
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5" />
                Test AWS S3 Connection
              </>
            )}
          </button>
          <Link
            to="/admin/manage"
            className="px-4 py-2 rounded-xl bg-obsidian-850 hover:bg-obsidian-800 text-obsidian-200 hover:text-white text-xs font-semibold border border-obsidian-800 transition-colors"
          >
            View All S3 Songs →
          </Link>
        </div>
      </div>

      {/* S3 Connectivity Test Result */}
      {s3TestResult && (
        <div
          className={`p-4 rounded-2xl border text-xs font-mono space-y-2 animate-in fade-in duration-200 ${
            s3TestResult.success
              ? 'bg-neonGreen/10 border-neonGreen/30 text-neonGreen'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              {s3TestResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-neonGreen" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>
                {s3TestResult.success
                  ? 'AWS S3 Access Verified'
                  : 'AWS S3 Access Denied (403 Forbidden)'}
              </span>
            </div>
            <button
              onClick={() => setS3TestResult(null)}
              className="p-1 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-obsidian-200">{s3TestResult.message}</p>
          {s3TestResult.remedy && (
            <div className="p-3 rounded-xl bg-obsidian-950 border border-obsidian-800 text-[11px] text-amber-300 font-sans space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-400">
                <ShieldAlert className="w-3.5 h-3.5" />
                How to resolve this in 3 clicks in AWS Console:
              </p>
              <p>
                1. Go to <strong>AWS Console</strong> &gt; <strong>IAM</strong> &gt; <strong>Users</strong> &gt; Click <strong>cloudbeats-local-dev</strong>.
              </p>
              <p>
                2. Click the <strong>Permissions</strong> tab &gt; <strong>Add permissions</strong> &gt; <strong>Attach policies directly</strong>.
              </p>
              <p>
                3. Search for <strong>AmazonS3FullAccess</strong>, check the box, and click <strong>Add permissions</strong>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Success Notification Banner */}
      {successData && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-neonGreen/15 via-obsidian-900 to-neonPurple/15 border border-neonGreen/40 shadow-neon-green space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5 text-neonGreen font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>Song Uploaded Successfully to AWS S3 & MongoDB!</span>
          </div>
          {successData.method && (
            <p className="text-[11px] text-emerald-400 font-mono">
              Via {successData.method} • Target S3 Bucket: cloudbeats-music-storage
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1 text-obsidian-200">
            <div className="p-2.5 rounded-xl bg-obsidian-950 border border-obsidian-800">
              <span className="text-obsidian-400 block text-[10px]">S3 Audio Object Key:</span>
              <span className="text-neonGreen truncate block" title={successData.audioKey}>
                {successData.audioKey}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-obsidian-950 border border-obsidian-800">
              <span className="text-obsidian-400 block text-[10px]">S3 Cover Object Key:</span>
              <span className="text-neonPurple truncate block" title={successData.coverKey || 'None'}>
                {successData.coverKey || 'Default Cover Assigned'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setSuccessData(null)}
              className="px-4 py-1.5 rounded-lg text-xs font-medium text-obsidian-400 hover:text-white"
            >
              Dismiss
            </button>
            <Link
              to="/admin/manage"
              className="px-4 py-1.5 rounded-lg bg-neonGreen text-obsidian-950 font-bold text-xs shadow-neon-green"
            >
              Manage Songs
            </Link>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="p-1 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {error.includes('CORS') && (
            <div className="p-3.5 rounded-xl bg-obsidian-950 border border-obsidian-800 text-[11px] text-amber-300 font-sans space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-amber-400 text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                How to enable CORS in AWS S3 (Takes 20 seconds):
              </p>
              <p>
                1. In AWS Console, go to <strong>Amazon S3</strong> &gt; click your bucket <strong>cloudbeats-music-storage</strong>.
              </p>
              <p>
                2. Click the <strong>Permissions</strong> tab, scroll down to <strong>Cross-origin resource sharing (CORS)</strong>, and click <strong>Edit</strong>.
              </p>
              <p>
                3. Paste the CORS JSON from <code>aws-docs/s3-cors.json</code> (with <code>"AllowedOrigins": ["*"]</code>) and click <strong>Save changes</strong>.
              </p>
            </div>
          )}

          {(error.includes('403') || error.includes('IAM')) && !error.includes('CORS') && (
            <div className="p-3 rounded-xl bg-obsidian-950 border border-obsidian-800 text-[11px] text-amber-300 font-sans space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-400">
                <ShieldAlert className="w-3.5 h-3.5" />
                Quick Fix in AWS Console (Takes 10 seconds):
              </p>
              <p>
                1. Go to <strong>AWS Console</strong> &gt; <strong>IAM</strong> &gt; <strong>Users</strong> &gt; Click <strong>cloudbeats-local-dev</strong>.
              </p>
              <p>
                2. Click the <strong>Permissions</strong> tab &gt; <strong>Add permissions</strong> &gt; <strong>Attach policies directly</strong>.
              </p>
              <p>
                3. Search for <strong>AmazonS3FullAccess</strong>, check the box, and click <strong>Add permissions</strong>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Upload Progress Overlay / Banner */}
      {uploading && (
        <div className="p-6 rounded-2xl bg-obsidian-900 border border-neonGreen/40 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-neonGreen animate-spin" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                {currentStep}
              </span>
            </div>
            <button
              onClick={handleCancelUpload}
              className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-semibold"
            >
              Cancel Upload
            </button>
          </div>

          {/* Audio Upload Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-obsidian-300">Audio Payload to S3 music/</span>
              <span className="text-neonGreen font-bold">
                {typeof audioProgress === 'number' ? audioProgress : 0}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-obsidian-950 overflow-hidden border border-obsidian-800">
              <div
                className="h-full bg-gradient-to-r from-neonGreen to-emerald-400 transition-all duration-150"
                style={{ width: `${typeof audioProgress === 'number' ? audioProgress : 0}%` }}
              />
            </div>
          </div>

          {/* Cover Upload Bar */}
          {coverFile && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-obsidian-300">Cover Artwork to S3 covers/</span>
                <span className="text-neonPurple font-bold">
                  {typeof coverProgress === 'number' ? coverProgress : 0}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-obsidian-950 overflow-hidden border border-obsidian-800">
                <div
                  className="h-full bg-gradient-to-r from-neonPurple to-purple-400 transition-all duration-150"
                  style={{ width: `${typeof coverProgress === 'number' ? coverProgress : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Channel Selector */}
      <div className="flex flex-wrap items-center justify-between p-3.5 rounded-2xl bg-obsidian-900 border border-obsidian-800 gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-obsidian-400">Upload Channel:</span>
          <span className="text-white font-semibold">
            {uploadMode === 'auto'
              ? '⚡ Auto-Adaptive (Direct S3 with Instant Server Relay Fallback)'
              : uploadMode === 'relay'
              ? '🛡️ S3 Server Relay (Bypasses S3 CORS completely)'
              : '🌐 Direct S3 Presigned PUT Only'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-obsidian-950 p-1 rounded-xl border border-obsidian-800 text-[11px] font-mono">
          <button
            type="button"
            onClick={() => setUploadMode('auto')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              uploadMode === 'auto'
                ? 'bg-neonGreen text-obsidian-950 font-bold'
                : 'text-obsidian-400 hover:text-white'
            }`}
          >
            Auto (Recommended)
          </button>
          <button
            type="button"
            onClick={() => setUploadMode('relay')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              uploadMode === 'relay'
                ? 'bg-neonPurple text-white font-bold'
                : 'text-obsidian-400 hover:text-white'
            }`}
          >
            S3 Relay (CORS-Free)
          </button>
          <button
            type="button"
            onClick={() => setUploadMode('direct')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              uploadMode === 'direct'
                ? 'bg-obsidian-750 text-white font-bold'
                : 'text-obsidian-400 hover:text-white'
            }`}
          >
            Direct S3
          </button>
        </div>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: File Pickers */}
          <div className="lg:col-span-1 space-y-4">
            {/* Audio File Dropzone */}
            <div className="p-4 rounded-2xl bg-obsidian-900 border border-obsidian-800 space-y-3">
              <label className="block text-xs font-mono font-bold text-neonGreen uppercase tracking-wider">
                1. Audio File (Required)
              </label>

              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-obsidian-750 hover:border-neonGreen/60 rounded-xl cursor-pointer bg-obsidian-950/60 hover:bg-obsidian-950 transition-colors group">
                <FileAudio className="w-8 h-8 text-obsidian-500 group-hover:text-neonGreen mb-2 transition-colors" />
                <span className="text-xs font-semibold text-white text-center">
                  {audioFile ? audioFile.name : 'Choose Audio File'}
                </span>
                <span className="text-[10px] text-obsidian-400 mt-1">
                  MP3, WAV, M4A, AAC (Max 50MB)
                </span>
                {audioFile && (
                  <span className="text-[10px] text-neonGreen font-mono mt-1">
                    {(audioFile.size / (1024 * 1024)).toFixed(2)} MB • {duration}s
                  </span>
                )}
                <input
                  type="file"
                  accept="audio/mp3,audio/mpeg,audio/wav,audio/m4a,audio/aac,audio/*"
                  onChange={handleAudioSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Cover Artwork Dropzone */}
            <div className="p-4 rounded-2xl bg-obsidian-900 border border-obsidian-800 space-y-3">
              <label className="block text-xs font-mono font-bold text-neonPurple uppercase tracking-wider">
                2. Cover Artwork (Optional)
              </label>

              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-obsidian-750 hover:border-neonPurple/60 rounded-xl cursor-pointer bg-obsidian-950/60 hover:bg-obsidian-950 transition-colors group relative overflow-hidden">
                {coverPreview ? (
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                    <img
                      src={coverPreview}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs text-white">
                      Change Artwork
                    </div>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-obsidian-500 group-hover:text-neonPurple mb-2 transition-colors" />
                    <span className="text-xs font-semibold text-white text-center">
                      Choose Album Art
                    </span>
                    <span className="text-[10px] text-obsidian-400 mt-1">
                      JPG, PNG, WEBP (Max 10MB)
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Right Column: Song Metadata */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-obsidian-900 border border-obsidian-800 space-y-4">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider border-b border-obsidian-800 pb-2">
              3. Song Metadata
            </h3>

            <div>
              <label className="block text-xs font-mono text-obsidian-300 mb-1.5">
                Song Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cyberpulse Midnight"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-obsidian-950 border border-obsidian-800 text-white text-sm focus:outline-none focus:border-neonGreen"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-obsidian-300 mb-1.5">
                Artist Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Neon Horizon"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-obsidian-950 border border-obsidian-800 text-white text-sm focus:outline-none focus:border-neonGreen"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-obsidian-300 mb-1.5">
                  Album Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Obsidian Sessions"
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-obsidian-950 border border-obsidian-800 text-white text-sm focus:outline-none focus:border-neonGreen"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-obsidian-300 mb-1.5">
                  Genre
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-obsidian-950 border border-obsidian-800 text-white text-sm focus:outline-none focus:border-neonGreen"
                >
                  {genres.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Architecture note */}
            <div className="p-4 rounded-xl bg-obsidian-950 border border-obsidian-800 text-xs font-mono text-obsidian-400 space-y-1">
              <span className="text-neonGreen font-semibold block">S3 Target Architecture:</span>
              <p>Audio destination: <code className="text-white">s3://cloudbeats-music-storage/music/[uuid]-[filename]</code></p>
              <p>Cover destination: <code className="text-white">s3://cloudbeats-music-storage/covers/[uuid]-[filename]</code></p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-neonGreen via-emerald-400 to-neonPurple text-obsidian-950 font-extrabold text-sm shadow-neon-green hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading Directly to S3...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5" />
                    Initiate Direct S3 Upload & Register Track
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

