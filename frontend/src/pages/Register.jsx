import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cloud, Lock, Mail, User, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await register(name, email, password, role);
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed. Please check the inputs.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] py-8 px-4">
      <div className="w-full max-w-md bg-obsidian-900/90 border border-obsidian-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neonPurple/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-neonPurple to-neonGreen mb-1 shadow-neon-purple">
            <Cloud className="w-6 h-6 text-obsidian-950" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Create Account</h2>
          <p className="text-xs text-obsidian-400">
            Join CloudBeats for cloud-native AWS S3 music streaming
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-obsidian-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-obsidian-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoComplete="name"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-obsidian-950 border border-obsidian-800 text-white text-sm focus:outline-none focus:border-neonPurple/60 transition-colors"
              />
            </div>
          </div>

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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-obsidian-950 border border-obsidian-800 text-white text-sm focus:outline-none focus:border-neonPurple/60 transition-colors"
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
                autoComplete="new-password"
                minLength={6}
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-obsidian-950 border border-obsidian-800 text-white text-sm focus:outline-none focus:border-neonPurple/60 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-obsidian-300 mb-1.5">
              Account Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  role === 'user'
                    ? 'bg-neonGreen/10 border-neonGreen text-neonGreen shadow-sm'
                    : 'bg-obsidian-950 border-obsidian-800 text-obsidian-400 hover:text-white'
                }`}
              >
                Music Listener
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                  role === 'admin'
                    ? 'bg-neonPurple/10 border-neonPurple text-neonPurple shadow-sm'
                    : 'bg-obsidian-950 border-obsidian-800 text-obsidian-400 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                S3 Administrator
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-neonPurple to-neonGreen text-obsidian-950 font-bold text-sm shadow-neon-purple hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              'Creating Account...'
            ) : (
              <>
                Register Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-obsidian-400">
          Already have an account?{' '}
          <Link to="/login" className="text-neonPurple font-semibold hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
};

