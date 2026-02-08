"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user, token, logout, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    favorites: 0,
    watching: 0,
    completed: 0,
    planning: 0,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (token) {
      // Загрузка статистики пользователя
      fetch('/api/user/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.stats) setStats(data.stats);
        })
        .catch(() => {});
    }
  }, [token]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* User Profile */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-6">
            {/* Аватар */}
            <div className="w-24 h-24 bg-violet-600 rounded-full flex items-center justify-center text-3xl font-bold text-white">
              {user?.displayName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{user?.displayName || user?.username}</h1>
              <p className="text-gray-400">@{user?.username}</p>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-violet-400">{stats.favorites}</div>
            <div className="text-sm text-gray-400 mt-1">Favorites</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{stats.watching}</div>
            <div className="text-sm text-gray-400 mt-1">Watching</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{stats.completed}</div>
            <div className="text-sm text-gray-400 mt-1">Completed</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">{stats.planning}</div>
            <div className="text-sm text-gray-400 mt-1">Plan to Watch</div>
          </div>
        </div>

        {/* Menu */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
          <Link href="/profile/favorites" className="flex items-center gap-4 px-6 py-4 hover:bg-gray-800/50 transition-all border-b border-gray-800">
            <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <div className="flex-1">
              <div className="text-white font-medium">Favorites</div>
              <div className="text-sm text-gray-400">Your favorite anime</div>
            </div>
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link href="/profile/watchlist" className="flex items-center gap-4 px-6 py-4 hover:bg-gray-800/50 transition-all border-b border-gray-800">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <div className="flex-1">
              <div className="text-white font-medium">Watchlist</div>
              <div className="text-sm text-gray-400">Watching, completed, planning</div>
            </div>
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link href="/profile/history" className="flex items-center gap-4 px-6 py-4 hover:bg-gray-800/50 transition-all border-b border-gray-800">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <div className="text-white font-medium">Watch History</div>
              <div className="text-sm text-gray-400">Recently watched episodes</div>
            </div>
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link href="/profile/settings" className="flex items-center gap-4 px-6 py-4 hover:bg-gray-800/50 transition-all">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="flex-1">
              <div className="text-white font-medium">Settings</div>
              <div className="text-sm text-gray-400">Edit profile and password</div>
            </div>
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Security info */}
        <div className="mt-6 bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-violet-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-violet-300">Your data is protected</h3>
              <p className="text-xs text-gray-400 mt-1">
                All your personal data is encrypted using AES-256. Password is stored as a bcrypt hash.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
