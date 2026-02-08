'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { getSeasonalAnime } from '@/lib/api/jikan';
import type { Anime } from '@/types/anime';

// Only 2026 seasons
const SEASONS_2026 = [
  { label: 'Winter 2026', season: 'winter' },
  { label: 'Spring 2026', season: 'spring' },
  { label: 'Summer 2026', season: 'summer' },
  { label: 'Fall 2026', season: 'fall' },
];

// Get current season for 2026
function getCurrentSeasonIndex(): number {
  const now = new Date();
  const month = now.getMonth() + 1;
  
  let currentSeason = 'winter';
  if (month >= 3 && month < 6) currentSeason = 'spring';
  else if (month >= 6 && month < 9) currentSeason = 'summer';
  else if (month >= 9 && month < 12) currentSeason = 'fall';
  
  const index = SEASONS_2026.findIndex(s => s.season === currentSeason);
  return index >= 0 ? index : 0;
}

export default function SeasonsPage() {
  const [selectedSeason, setSelectedSeason] = useState(getCurrentSeasonIndex());
  const [anime, setAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSeasonalAnime = async () => {
      try {
        setLoading(true);
        const season = SEASONS_2026[selectedSeason];
        const animeData = await getSeasonalAnime();

        if (isMounted && animeData) {
          setAnime(animeData);
        }
      } catch (error) {
        console.error('Failed to fetch seasonal anime:', error);
        if (isMounted) {
          setAnime([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSeasonalAnime();

    return () => {
      isMounted = false;
    };
  }, [selectedSeason]);

  const currentSeason = SEASONS_2026[selectedSeason];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Anime Seasons 2026
          </h1>
          <p className="text-gray-500 text-lg">Select a season to browse anime releases</p>
        </div>

        {/* Season selector - Grid style like anihub */}
        <div className="mb-12 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {SEASONS_2026.map((season, index) => (
            <button
              key={index}
              onClick={() => setSelectedSeason(index)}
              className={`relative group overflow-hidden rounded-xl transition-all duration-300 py-8 px-6 text-center font-bold text-lg ${
                selectedSeason === index
                  ? 'bg-linear-to-br from-violet-600 to-violet-800 text-white shadow-2xl shadow-violet-600/30 scale-105'
                  : 'bg-gray-900/50 text-gray-300 hover:bg-gray-800 border border-gray-800/50 hover:border-gray-700'
              }`}
            >
              <div className="relative z-10">{season.label}</div>
              {selectedSeason === index && (
                <div className="absolute inset-0 bg-linear-to-r from-violet-400/10 via-violet-500/10 to-violet-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
            </button>
          ))}
        </div>

        {/* Current season title */}
        <div className="mb-8 border-b border-gray-800 pb-6">
          <h2 className="text-3xl font-bold text-white mb-2">{currentSeason.label}</h2>
          <p className="text-gray-500">
            {loading ? 'Loading anime...' : `${anime.length} anime in this season`}
          </p>
        </div>

        {/* Anime grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              <p className="text-gray-400">Loading anime for {currentSeason.label}...</p>
            </div>
          </div>
        ) : anime.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {anime.map((item) => (
              <Link key={item.malId || item.id} href={`/anime/${item.malId || item.id}`} className="group h-full">
                <div className="relative h-full rounded-xl overflow-hidden bg-gray-900 hover:shadow-2xl transition-all duration-300 hover:shadow-violet-500/20">
                  {/* Image container */}
                  <div className="relative aspect-3/4 bg-gray-800 overflow-hidden">
                    {item.poster && (
                      <Image
                        src={item.poster}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110 group-hover:brightness-125"
                        unoptimized
                      />
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent group-hover:from-black/70 transition-all duration-300" />

                    {/* Score badge */}
                    {item.score && item.score > 0 && (
                      <div className="absolute top-3 right-3 bg-violet-600/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1 shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                        <span>⭐</span>
                        <span>{item.score.toFixed(1)}</span>
                      </div>
                    )}

                    {/* Type badge */}
                    {item.type && (
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-semibold text-white/80 uppercase tracking-wider">
                        {item.type}
                      </div>
                    )}
                  </div>

                  {/* Info section */}
                  <div className="p-3 bg-gray-900/50 backdrop-blur-sm border-t border-gray-800/50">
                    <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-violet-400 transition-colors leading-tight mb-2">
                      {item.titleEnglish || item.title}
                    </h3>

                    {/* Genres */}
                    {item.genres && item.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.genres.slice(0, 2).map((genre, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-violet-600/20 text-violet-300 text-[10px] font-medium rounded border border-violet-600/30 hover:bg-violet-600/30 transition-colors"
                          >
                            {typeof genre === 'string' ? genre : genre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg
              className="w-16 h-16 text-gray-700 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-xl font-medium text-white mb-2">No anime found</h3>
            <p className="text-gray-500">Please try another season</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
