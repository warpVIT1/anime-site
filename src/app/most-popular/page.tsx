'use client';

import { useState, useEffect } from 'react';
import { getTopAnime } from '@/lib/api';
import type { Anime } from '@/types/anime';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import Image from 'next/image';

const TIME_FILTERS = [
  { id: 'all_time', label: 'All Time', years: null },
  { id: 'past_year', label: 'Past Year', years: 1 },
  { id: 'past_2_years', label: 'Past 2 Years', years: 2 },
  { id: 'past_5_years', label: 'Past 5 Years', years: 5 },
  { id: 'past_10_years', label: 'Past 10 Years', years: 10 },
  { id: 'past_20_years', label: 'Past 20 Years', years: 20 },
];

function AnimeCard({ anime, index }: { anime: Anime; index: number }) {
  const displayTitle = anime.titleEnglish || anime.title;
  const animeId = anime.malId || anime.id;

  return (
    <Link
      href={`/anime/${animeId}`}
      className="group block"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="relative aspect-3/4 rounded-xl overflow-hidden bg-gray-800 mb-3 shadow-lg">
        <Image
          src={anime.poster}
          alt={displayTitle}
          fill
          className="object-cover transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
        />

        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent" />

        {anime.score && anime.score > 0 && (
          <div className="absolute top-3 left-3 bg-violet-600/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-lg">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {anime.score.toFixed(1)}
          </div>
        )}

        {anime.popularity !== undefined && (
          <div className="absolute top-3 right-3 bg-emerald-600/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-lg">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            #{anime.popularity}
          </div>
        )}
      </div>

      <div className="min-h-[60px]">
        <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-violet-400 transition-colors">
          {displayTitle}
        </h3>
        <p className="text-xs text-gray-400 mt-1">{anime.year || 'N/A'}</p>
        {anime.genres && anime.genres.length > 0 && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
            {anime.genres.slice(0, 2).join(', ')}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function MostPopularPage() {
  const [anime, setAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all_time');
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function loadAnime() {
      setLoading(true);
      setPage(1);
      try {
        const filter = TIME_FILTERS.find(f => f.id === selectedFilter);
        const data = await getTopAnime(1);
        
        if (filter?.years) {
          const currentYear = new Date().getFullYear();
          const minYear = currentYear - filter.years;
          const filtered = data.filter(a => (a.year || 0) >= minYear);
          setAnime(filtered);
        } else {
          setAnime(data);
        }
      } catch (error) {
        console.error('Failed to load anime:', error);
        setAnime([]);
      } finally {
        setLoading(false);
      }
    }

    loadAnime();
  }, [selectedFilter]);

  const itemsPerPage = 48;
  const displayedAnime = anime.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(anime.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
              <svg className="w-full h-full text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            <div className="flex flex-col items-center sm:items-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Most Popular Anime
              </h1>
              <p className="text-gray-400 text-sm sm:text-base max-w-md">
                Discover the most popular anime sorted by time period
              </p>
            </div>
          </div>
        </div>

        {/* Time Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {TIME_FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                  selectedFilter === filter.id
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/50'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Anime Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              <p className="text-gray-400">Loading popular anime...</p>
            </div>
          </div>
        ) : anime.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 mb-8">
              {displayedAnime.map((a, index) => (
                <AnimeCard key={a.malId || a.id} anime={a} index={index} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = 1;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page > totalPages - 3) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-violet-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}

            <div className="text-center mt-8 text-gray-400 text-sm">
              Showing {(page - 1) * itemsPerPage + 1} - {Math.min(page * itemsPerPage, anime.length)} of {anime.length} anime
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-xl font-medium text-white mb-2">No anime found</h3>
            <p className="text-gray-400">Try adjusting your filters</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
