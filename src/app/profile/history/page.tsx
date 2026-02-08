"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';

interface HistoryItem {
  id: string;
  animeId: number;
  title: string;
  image: string;
  episode: number;
  progress: number; // percentage watched
  watchedAt: string;
}

export default function HistoryPage() {
  const { token, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/user/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.history) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear your watch history?')) return;

    try {
      await fetch('/api/user/history', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const removeFromHistory = async (id: string) => {
    try {
      await fetch(`/api/user/history/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(history.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to remove from history:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group history by date
  const groupedHistory = history.reduce((groups, item) => {
    const date = formatDate(item.watchedAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, HistoryItem[]>);

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

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <svg className="w-8 h-8 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch History
            </h1>
            <p className="text-gray-400 mt-1">{history.length} entries in your history</p>
          </div>

          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear History
            </button>
          )}
        </div>

        {/* History List */}
        {history.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-24 h-24 mx-auto text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-white mb-2">No watch history</h2>
            <p className="text-gray-400 mb-6">Start watching anime to build your history!</p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedHistory).map(([date, items]) => (
              <div key={date}>
                <h2 className="text-lg font-medium text-gray-300 mb-4">{date}</h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-gray-700 transition-all group"
                    >
                      {/* Thumbnail */}
                      <Link href={`/anime/${item.animeId}/watch?ep=${item.episode}`} className="shrink-0 relative">
                        <div className="relative w-40 h-24 rounded-lg overflow-hidden bg-gray-800">
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                          {/* Play overlay */}
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                            <div
                              className="h-full bg-violet-500"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/anime/${item.animeId}`}>
                          <h3 className="text-white font-medium hover:text-violet-400 transition-colors line-clamp-1">
                            {item.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-400 mt-1">
                          Episode {item.episode} • {item.progress}% watched
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(item.watchedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/anime/${item.animeId}/watch?ep=${item.episode}`}
                          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg transition-all"
                        >
                          Continue
                        </Link>
                        <button
                          onClick={() => removeFromHistory(item.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Remove from history"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
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
