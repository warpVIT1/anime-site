"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';

interface WatchlistItem {
  id: string;
  animeId: number;
  title: string;
  image: string;
  status: 'watching' | 'completed' | 'planned' | 'on_hold' | 'dropped';
  progress: number;
  totalEpisodes: number | null;
  score: number | null;
  updatedAt: string;
}

const STATUS_CONFIG = {
  watching: { label: 'Watching', color: 'bg-green-500', icon: '▶️' },
  completed: { label: 'Completed', color: 'bg-blue-500', icon: '✓' },
  planned: { label: 'Plan to Watch', color: 'bg-purple-500', icon: '📋' },
  on_hold: { label: 'On Hold', color: 'bg-yellow-500', icon: '⏸️' },
  dropped: { label: 'Dropped', color: 'bg-red-500', icon: '✕' },
};

export default function WatchlistPage() {
  const { token, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (token) {
      fetchWatchlist();
    }
  }, [token]);

  const fetchWatchlist = async () => {
    try {
      const res = await fetch('/api/user/watchlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.watchlist) {
        setWatchlist(data.watchlist);
      }
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (animeId: number, newStatus: string) => {
    try {
      await fetch('/api/user/watchlist', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ animeId, status: newStatus }),
      });
      setWatchlist(watchlist.map(item =>
        item.animeId === animeId ? { ...item, status: newStatus as WatchlistItem['status'] } : item
      ));
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const removeFromWatchlist = async (animeId: number) => {
    try {
      await fetch('/api/user/watchlist', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ animeId }),
      });
      setWatchlist(watchlist.filter(item => item.animeId !== animeId));
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    }
  };

  const filteredWatchlist = activeTab === 'all'
    ? watchlist
    : watchlist.filter(item => item.status === activeTab);

  const statusCounts = {
    all: watchlist.length,
    watching: watchlist.filter(i => i.status === 'watching').length,
    completed: watchlist.filter(i => i.status === 'completed').length,
    planned: watchlist.filter(i => i.status === 'planned').length,
    on_hold: watchlist.filter(i => i.status === 'on_hold').length,
    dropped: watchlist.filter(i => i.status === 'dropped').length,
  };

  if (loading || isLoading) {
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <svg className="w-8 h-8 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            My Watchlist
          </h1>
          <p className="text-gray-400 mt-1">Track your anime watching progress</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'watching', 'completed', 'planned', 'on_hold', 'dropped'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === status
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {status === 'all' ? 'All' : STATUS_CONFIG[status].label}
              <span className="ml-2 px-1.5 py-0.5 bg-black/30 rounded text-xs">
                {statusCounts[status]}
              </span>
            </button>
          ))}
        </div>

        {/* Watchlist */}
        {filteredWatchlist.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-24 h-24 mx-auto text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="text-xl font-semibold text-white mb-2">
              {activeTab === 'all' ? 'Your watchlist is empty' : `No anime in "${STATUS_CONFIG[activeTab as keyof typeof STATUS_CONFIG]?.label || 'this category'}"`}
            </h2>
            <p className="text-gray-400 mb-6">Start tracking your anime progress!</p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredWatchlist.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-gray-700 transition-all"
              >
                {/* Image */}
                <Link href={`/anime/${item.animeId}`} className="shrink-0">
                  <div className="relative w-16 h-24 rounded-lg overflow-hidden bg-gray-800">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/anime/${item.animeId}`}>
                    <h3 className="text-white font-medium hover:text-violet-400 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                  </Link>
                  
                  <div className="flex items-center gap-3 mt-2">
                    {/* Status Badge */}
                    <span className={`px-2 py-0.5 ${STATUS_CONFIG[item.status].color} rounded text-xs text-white font-medium`}>
                      {STATUS_CONFIG[item.status].label}
                    </span>

                    {/* Progress */}
                    <span className="text-sm text-gray-400">
                      {item.progress} / {item.totalEpisodes || '?'} episodes
                    </span>

                    {/* Score */}
                    {item.score && (
                      <span className="flex items-center gap-1 text-sm text-gray-400">
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {item.score}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {item.totalEpisodes && (
                    <div className="mt-2 w-full max-w-xs h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full transition-all"
                        style={{ width: `${(item.progress / item.totalEpisodes) * 100}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Status Dropdown */}
                  <select
                    value={item.status}
                    onChange={(e) => updateStatus(item.animeId, e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                  >
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromWatchlist(item.animeId)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Remove from watchlist"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back to Profile */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Profile
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
