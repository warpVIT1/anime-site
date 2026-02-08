"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';

interface FavoriteAnime {
  id: string;
  animeId: number;
  title: string;
  image: string;
  score: number | null;
  episodes: number | null;
  status: string | null;
  addedAt: string;
}

export default function FavoritesPage() {
  const { token, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteAnime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'addedAt' | 'title' | 'score'>('addedAt');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (token) {
      fetchFavorites();
    }
  }, [token]);

  const fetchFavorites = async () => {
    try {
      const res = await fetch('/api/user/favorites', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.favorites) {
        setFavorites(data.favorites);
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFavorite = async (animeId: number) => {
    try {
      await fetch('/api/user/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ animeId }),
      });
      setFavorites(favorites.filter(f => f.animeId !== animeId));
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  const sortedFavorites = [...favorites].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'score') return (b.score || 0) - (a.score || 0);
    return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
  });

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              My Favorites
            </h1>
            <p className="text-gray-400 mt-1">{favorites.length} anime in your favorites</p>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'addedAt' | 'title' | 'score')}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
            >
              <option value="addedAt">Date Added</option>
              <option value="title">Title</option>
              <option value="score">Score</option>
            </select>
          </div>
        </div>

        {/* Favorites Grid */}
        {sortedFavorites.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-24 h-24 mx-auto text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-white mb-2">No favorites yet</h2>
            <p className="text-gray-400 mb-6">Start adding anime to your favorites!</p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all"
            >
              Browse Catalog
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {sortedFavorites.map((anime) => (
              <div key={anime.id} className="group relative">
                <Link href={`/anime/${anime.animeId}`}>
                  <div className="relative aspect-2/3 rounded-xl overflow-hidden bg-gray-800">
                    <Image
                      src={anime.image}
                      alt={anime.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {anime.score && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/70 rounded-lg">
                        <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs font-medium text-white">{anime.score.toFixed(1)}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-white line-clamp-2 group-hover:text-violet-400 transition-colors">
                    {anime.title}
                  </h3>
                </Link>

                {/* Remove button */}
                <button
                  onClick={() => removeFavorite(anime.animeId)}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove from favorites"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
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
