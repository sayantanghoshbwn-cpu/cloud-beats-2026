import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  UploadCloud,
  Layers,
  Database,
  Lock,
  Cloud,
  CheckCircle2,
  HardDrive,
  FileAudio,
  Image as ImageIcon,
} from 'lucide-react';
import { songAPI, getHealth } from '../services/api';

export const AdminDashboard = () => {
  const [songCount, setSongCount] = useState(0);
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [songsRes, healthRes] = await Promise.all([
          songAPI.getSongs({ limit: 1 }),
          getHealth(),
        ]);
        if (songsRes.data.success) {
          setSongCount(songsRes.data.total || 0);
        }
        setHealthData(healthRes.data);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neonPurple/15 border border-neonPurple/30 text-neonPurple text-xs font-mono font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ADMINISTRATOR CONSOLE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            AWS S3 Storage Management
          </h1>
          <p className="text-xs text-obsidian-400">
            Monitor and control cloud music files, presigned URLs, and access controls
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/upload"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neonGreen text-obsidian-950 font-bold text-xs shadow-neon-green hover:scale-105 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Track
          </Link>
          <Link
            to="/admin/manage"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-obsidian-850 hover:bg-obsidian-800 text-white font-semibold text-xs border border-obsidian-750 transition-colors"
          >
            <Layers className="w-4 h-4 text-neonPurple" />
            Manage Library
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-obsidian-900 border border-obsidian-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-obsidian-400">Total Registered Tracks</span>
            <FileAudio className="w-4 h-4 text-neonGreen" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">{loading ? '...' : songCount}</p>
          <p className="text-[11px] text-neonGreen font-medium">Stored in S3 music/ prefix</p>
        </div>

        <div className="p-5 rounded-2xl bg-obsidian-900 border border-obsidian-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-obsidian-400">S3 Bucket Access</span>
            <Lock className="w-4 h-4 text-neonPurple" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">100% Private</p>
          <p className="text-[11px] text-neonPurple font-medium">Public ACLs Disabled</p>
        </div>

        <div className="p-5 rounded-2xl bg-obsidian-900 border border-obsidian-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-obsidian-400">Presigned PUT Expiry</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">300 Seconds</p>
          <p className="text-[11px] text-emerald-400 font-medium">Time-limited Direct Uploads</p>
        </div>

        <div className="p-5 rounded-2xl bg-obsidian-900 border border-obsidian-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-obsidian-400">Streaming Protocol</span>
            <Cloud className="w-4 h-4 text-neonGreen" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">HTTP Range</p>
          <p className="text-[11px] text-neonGreen font-medium">Presigned GET Scrubbing</p>
        </div>
      </div>

      {/* Architecture & S3 Settings Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bucket Specs */}
        <div className="p-6 rounded-3xl bg-obsidian-900 border border-obsidian-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 pb-2 border-b border-obsidian-800">
            <Database className="w-5 h-5 text-neonGreen" />
            <h3 className="font-bold text-white text-base">AWS S3 Infrastructure State</h3>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between py-2 border-b border-obsidian-850">
              <span className="text-obsidian-400">Target S3 Bucket:</span>
              <span className="text-white font-semibold">{healthData?.aws?.bucket || 'cloudbeats-music-storage'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-obsidian-850">
              <span className="text-obsidian-400">AWS Region:</span>
              <span className="text-neonGreen">{healthData?.aws?.region || 'us-east-1'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-obsidian-850">
              <span className="text-obsidian-400">AWS SDK Version:</span>
              <span className="text-neonPurple">AWS SDK for JavaScript v3</span>
            </div>
            <div className="flex justify-between py-2 border-b border-obsidian-850">
              <span className="text-obsidian-400">Audio Directory:</span>
              <span className="text-emerald-400">cloudbeats-music-storage/music/</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-obsidian-400">Cover Artwork Directory:</span>
              <span className="text-neonPurple">cloudbeats-music-storage/covers/</span>
            </div>
          </div>
        </div>

        {/* Security & Workflow Highlights */}
        <div className="p-6 rounded-3xl bg-obsidian-900 border border-obsidian-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 pb-2 border-b border-obsidian-800">
            <ShieldCheck className="w-5 h-5 text-neonPurple" />
            <h3 className="font-bold text-white text-base">Security & Architecture Rules</h3>
          </div>

          <div className="space-y-3 text-xs text-obsidian-300">
            <div className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-neonGreen mt-1.5 flex-shrink-0"></div>
              <p>
                <strong className="text-white">Direct Browser-to-S3 Uploads:</strong> Audio files upload directly to S3 via presigned PUT URLs, preventing heavy audio payloads from choking the Node.js server.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-neonPurple mt-1.5 flex-shrink-0"></div>
              <p>
                <strong className="text-white">Zero Public Exposure:</strong> S3 Block Public Access is active. Songs are streamed via time-limited presigned GET URLs generated on-demand.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></div>
              <p>
                <strong className="text-white">Atomic Cleanup:</strong> Deleting a song removes both S3 audio and cover objects alongside the MongoDB metadata.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

