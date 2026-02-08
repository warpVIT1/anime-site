"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    login: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      console.log('[Login] API response:', data);
      
      // Update auth context and localStorage
      login(data.token, data.user);
      
      console.log('[Login] login() called, redirecting...');

      // Use window.location for full page reload to ensure auth state is read from localStorage
      window.location.href = '/';
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Header />

      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Логотип */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-1">
              <span className="text-3xl font-bold text-violet-500">ANI</span>
              <span className="text-3xl font-bold text-white">HUB</span>
            </Link>
            <h1 className="mt-4 text-2xl font-bold text-white">Sign In</h1>
            <p className="mt-2 text-gray-400">Welcome back!</p>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="login" className="block text-sm font-medium text-gray-300 mb-2">
                Email or Username
              </label>
              <input
                type="text"
                id="login"
                name="login"
                value={formData.login}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                placeholder="Enter email or username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                placeholder="Enter password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="text-center text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium">
                Sign Up
              </Link>
            </div>
          </form>

          {/* Additional info */}
          <div className="mt-6 text-center text-gray-500 text-xs">
            Your data is securely encrypted
          </div>
        </div>
      </main>
    </div>
  );
}
