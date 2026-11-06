import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Player } from './components/Player';
import { NowPlayingPanel } from './components/NowPlayingPanel';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

import { Dashboard } from './pages/Dashboard';
import { Search } from './pages/Search';
import { Playlists } from './pages/Playlists';
import { PlaylistDetail } from './pages/PlaylistDetail';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUpload } from './pages/AdminUpload';
import { AdminManageSongs } from './pages/AdminManageSongs';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <PlayerProvider>
          <div className="flex flex-col min-h-screen bg-obsidian-950 text-obsidian-100 selection:bg-neonGreen selection:text-black">
            {/* Top Navigation */}
            <Navbar />

            {/* Main Application Body */}
            <div className="flex flex-1 relative">
              {/* Sidebar */}
              <Sidebar />

              {/* Main Content Area */}
              <main className="flex-1 px-4 lg:px-8 py-6 max-w-7xl mx-auto w-full overflow-y-auto min-h-[calc(100vh-4rem-5.5rem)]">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/playlists" element={<Playlists />} />
                  <Route path="/playlists/:id" element={<PlaylistDetail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Admin Only Protected Routes */}
                  <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/upload" element={<AdminUpload />} />
                    <Route path="/admin/manage" element={<AdminManageSongs />} />
                  </Route>

                  {/* Catch-all */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              {/* Slide-out Now Playing Panel */}
              <NowPlayingPanel />
            </div>

            {/* Persistent Audio Player Bar */}
            <Player />
          </div>
        </PlayerProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

