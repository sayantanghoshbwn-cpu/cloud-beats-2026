import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Cloud,
  Search,
  User,
  ShieldCheck,
  LogOut,
  UploadCloud,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-obsidian-900/80 backdrop-blur-xl border-b border-obsidian-800">
      <div className="flex items-center justify-between px-4 lg:px-8 h-16">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neonGreen to-neonPurple p-0.5 shadow-neon-green transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-obsidian-950 rounded-[10px] flex items-center justify-center">
                <Cloud className="w-5 h-5 text-neonGreen group-hover:text-neonPurple transition-colors" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-neonGreen via-white to-neonPurple bg-clip-text text-transparent">
                CloudBeats
              </span>
              <span className="text-[10px] text-obsidian-400 font-mono tracking-wider -mt-1">
                AWS S3 STREAMING
              </span>
            </div>
          </Link>

          {/* AWS Architecture Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-850 border border-emerald-500/20 text-xs">
            <span className="w-2 h-2 rounded-full bg-neonGreen animate-pulse"></span>
            <span className="text-obsidian-200">AWS S3 Private Storage</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neonPurple/20 text-neonPurple font-mono font-medium">
              us-east-1
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden sm:flex items-center relative w-72 lg:w-96"
        >
          <Search className="w-4 h-4 text-obsidian-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search songs, artists, albums, or genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-obsidian-850 border border-obsidian-800 rounded-full focus:outline-none focus:border-neonGreen/60 focus:ring-1 focus:ring-neonGreen/40 text-obsidian-100 placeholder-obsidian-400 transition-all"
          />
        </form>

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-full bg-obsidian-850 hover:bg-obsidian-800 border border-obsidian-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neonGreen to-neonPurple flex items-center justify-center text-obsidian-950 font-bold text-sm">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:flex flex-col text-left pr-2">
                  <span className="text-xs font-semibold text-white leading-none">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-neonGreen font-mono uppercase">
                    {user.role}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-obsidian-400 mr-1" />
              </button>

              {/* User Dropdown */}
              {dropdownOpen && (
                <div
                  onMouseLeave={() => setDropdownOpen(false)}
                  className="absolute right-0 mt-2 w-56 bg-obsidian-900 border border-obsidian-700 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-4 py-2 border-b border-obsidian-800">
                    <p className="text-xs text-obsidian-400">Signed in as</p>
                    <p className="text-sm font-semibold text-white truncate">
                      {user.email}
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="py-1 border-b border-obsidian-800">
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-neonPurple hover:bg-neonPurple/10 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                      <Link
                        to="/admin/upload"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-neonGreen hover:bg-neonGreen/10 transition-colors"
                      >
                        <UploadCloud className="w-4 h-4" />
                        Upload Music to S3
                      </Link>
                      <Link
                        to="/admin/manage"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-obsidian-200 hover:bg-obsidian-800 transition-colors"
                      >
                        <Layers className="w-4 h-4" />
                        Manage S3 Songs
                      </Link>
                    </div>
                  )}

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-1.5 text-xs font-semibold text-obsidian-200 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 text-xs font-bold bg-gradient-to-r from-neonGreen to-emerald-400 text-obsidian-950 rounded-full hover:shadow-neon-green hover:scale-105 transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

