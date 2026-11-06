import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Cloud, Lock, Mail, ArrowRight, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Invalid credentials. Please verify your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Quick fill credentials for demo
  const fillCredentials = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] py-8 px-4">
      <div className="w-full max-w-md bg-obsidian-900/90 border border-obsidian-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow ambient spots */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-neonGreen/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-neonPurple/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-neonGreen to-neonPurple mb-1 shadow-neon-green">
            <Cloud className="w-6 h-6 text-obsidian-950" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Welcome Back</h2>
          <p className="text-xs text-obsidian-400">
            Sign in to access your CloudBeats audio library & AWS S3 controls
          </p>
        </div>

        {/* Demo Fast Login Pills */}
        <div className="mb-6 p-3 rounded-2xl bg-obsidian-950 border border-obsidian-800 space-y-2">
          <p className="text-[11px] font-mono font-semibold text-obsidian-400 text-center">
            DEMO QUICK LOGINS
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('admin@cloudbeats.io', 'adminpassword123')}
              className="px-2.5 py-1.5 rounded-xl bg-neonPurple/15 hover:bg-neonPurple/25 border border-neonPurple/30 text-neonPurple text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Fill Admin
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('user@cloudbeats.io', 'userpassword123')}
              className="px-2.5 py-1.5 rounded-xl bg-neonGreen/15 hover:bg-neonGreen/25 border border-neonGreen/30 text-neonGreen text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              Fill User
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-obsidian-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-obsidian-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-obsidian-950 border border-obsidian-800 text-white text-sm focus:outline-none focus:border-neonGreen/60 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-obsidian-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-obsidian-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-obsidian-950 border border-obsidian-800 text-white text-sm focus:outline-none focus:border-neonGreen/60 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-neonGreen to-emerald-400 text-obsidian-950 font-bold text-sm shadow-neon-green hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              'Authenticating...'
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-obsidian-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-neonGreen font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

