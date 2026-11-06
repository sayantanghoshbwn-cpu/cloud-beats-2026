import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  Search,
  ListMusic,
  UploadCloud,
  Shield,
  Layers,
  Database,
  Lock,
  Radio,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { isAdmin } = useAuth();

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-gradient-to-r from-neonGreen/20 to-neonPurple/10 text-white border-l-4 border-neonGreen shadow-sm font-semibold'
        : 'text-obsidian-400 hover:text-obsidian-100 hover:bg-obsidian-850'
    }`;

  const adminNavLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-gradient-to-r from-neonPurple/20 to-neonGreen/10 text-white border-l-4 border-neonPurple shadow-sm font-semibold'
        : 'text-obsidian-400 hover:text-obsidian-100 hover:bg-obsidian-850'
    }`;

  return (
    <aside className="w-64 flex-shrink-0 hidden md:flex flex-col justify-between bg-obsidian-900 border-r border-obsidian-800 p-4 h-[calc(100vh-4rem-5.5rem)] sticky top-16 overflow-y-auto">
      <div className="space-y-6">
        {/* Navigation Group */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-mono font-bold tracking-wider text-obsidian-400 uppercase">
            Menu
          </div>
          <nav className="space-y-1">
            <NavLink to="/" end className={navLinkClass}>
              <Compass className="w-4 h-4 text-neonGreen" />
              <span>Discover</span>
            </NavLink>
            <NavLink to="/search" className={navLinkClass}>
              <Search className="w-4 h-4 text-neonGreen" />
              <span>Search</span>
            </NavLink>
            <NavLink to="/playlists" className={navLinkClass}>
              <ListMusic className="w-4 h-4 text-neonGreen" />
              <span>Playlists</span>
            </NavLink>
          </nav>
        </div>

        {/* Admin Navigation Group */}
        {isAdmin && (
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-mono font-bold tracking-wider text-neonPurple uppercase">
                Admin Center
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neonPurple/20 text-neonPurple border border-neonPurple/30">
                S3 Control
              </span>
            </div>
            <nav className="space-y-1">
              <NavLink to="/admin" end className={adminNavLinkClass}>
                <Shield className="w-4 h-4 text-neonPurple" />
                <span>Overview</span>
              </NavLink>
              <NavLink to="/admin/upload" className={adminNavLinkClass}>
                <UploadCloud className="w-4 h-4 text-neonGreen" />
                <span>Upload Music</span>
              </NavLink>
              <NavLink to="/admin/manage" className={adminNavLinkClass}>
                <Layers className="w-4 h-4 text-neonPurple" />
                <span>Manage Songs</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* S3 Storage Specs Widget */}
      <div className="p-3.5 rounded-2xl bg-obsidian-950 border border-obsidian-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <Database className="w-3.5 h-3.5 text-neonGreen" />
            <span>AWS S3 Specs</span>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-neonGreen font-mono font-medium">
            <Lock className="w-2.5 h-2.5" />
            Private
          </span>
        </div>
        <div className="space-y-1 text-[11px] font-mono text-obsidian-400">
          <div className="flex justify-between">
            <span>Bucket:</span>
            <span className="text-obsidian-200 truncate max-w-[120px]" title="cloudbeats-music-storage">
              cloudbeats-s3
            </span>
          </div>
          <div className="flex justify-between">
            <span>Upload:</span>
            <span className="text-neonGreen">Presigned PUT</span>
          </div>
          <div className="flex justify-between">
            <span>Stream:</span>
            <span className="text-neonPurple">Presigned GET</span>
          </div>
          <div className="flex justify-between">
            <span>Audio Scrub:</span>
            <span className="text-emerald-400">HTTP Range</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

