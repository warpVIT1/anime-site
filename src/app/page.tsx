'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getTopAnime, getSeasonalAnime } from '@/lib/api';
import type { Anime } from '@/types/anime';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import Link from 'next/link';
import Image from 'next/image';

// Genre icons as SVG components
const GenreIcons: Record<string, React.ReactNode> = {
  Action: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 13l2 2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Adventure: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="10" r="3"/>
      <path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11.5 7.3 11.8a1 1 0 0 0 1.4 0C13 21.5 20 15.4 20 10a8 8 0 0 0-8-8z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Comedy: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Drama: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6M2 12a10 10 0 0 0 10 10" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="10" r="2"/>
    </svg>
  ),
  Fantasy: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l1.5 4.5H18l-3.5 2.5 1.5 4.5L12 12l-4 2.5 1.5-4.5L6 7.5h4.5L12 3zM5 19h14" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Romance: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'Sci-Fi': (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" strokeLinecap="round"/>
    </svg>
  ),
  'Slice of Life': (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Sports: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10zM2 12h20" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Horror: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
      <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
      <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
      <path d="M8 16s1.5-2 4-2 4 2 4 2" strokeLinecap="round"/>
    </svg>
  ),
  Mystery: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35M11 8v4M11 16h.01" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Supernatural: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L9 9l-7 1 5.5 4.5L5 22l7-4 7 4-2.5-7.5L22 10l-7-1-3-7z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

function AnimeCardCompact({ anime }: { anime: Anime }) {
  const displayTitle = anime.titleEnglish || anime.title;
  const animeId = anime.malId || anime.id;

  return (
    <Link href={`/anime/${animeId}`} className="group block shrink-0 w-40 sm:w-45">
      <div className="relative aspect-3/4 rounded-xl overflow-hidden bg-gray-800 mb-2">
        <Image
          src={anime.poster}
          alt={displayTitle}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          sizes="180px"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {anime.score && anime.score > 0 && (
          <div className="absolute top-2 left-2 bg-violet-600 px-2 py-0.5 rounded-md text-xs font-bold text-white flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {anime.score.toFixed(1)}
          </div>
        )}

        {anime.episodes && (
          <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-xs text-white">
            {anime.episodes} ep
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-violet-400 transition-colors">
        {displayTitle}
      </h3>
    </Link>
  );
}

function HorizontalScroll({ children, title }: { children: React.ReactNode; title: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-3">
          <span className="w-1 h-6 bg-violet-500 rounded-full" />
          {title}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
    </section>
  );
}

function AnimeGridCard({ anime, index }: { anime: Anime; index: number }) {
  const displayTitle = anime.titleEnglish || anime.title;
  const animeId = anime.malId || anime.id;

  return (
    <Link
      href={`/anime/${animeId}`}
      className="group block"
      style={{ animationDelay: `${index * 50}ms` }}
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

        {anime.type && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white uppercase">
            {anime.type}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3">
          {anime.genres && anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {anime.genres.slice(0, 2).map((genre, i) => (
                <span key={i} className="px-2 py-0.5 bg-white/10 backdrop-blur-sm rounded text-[10px] text-white/80">
                  {genre}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-300">
            {anime.year && <span>{anime.year}</span>}
            {anime.episodes && (
              <>
                <span className="w-1 h-1 bg-gray-500 rounded-full" />
                <span>{anime.episodes} episodes</span>
              </>
            )}
          </div>
        </div>
      </div>

      <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-violet-400 transition-colors leading-tight">
        {displayTitle}
      </h3>
    </Link>
  );
}

// Hero Section Component with smooth crossfade
function HeroSection({ animes }: { animes: Anime[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const featuredAnimes = animes.slice(0, 5);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
  }, [isTransitioning, currentIndex]);

  // Handle the display update after transition starts
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setDisplayIndex(currentIndex);
        setIsTransitioning(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning, currentIndex]);

  // Auto-rotate every 7 seconds
  useEffect(() => {
    if (featuredAnimes.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => (prev + 1) % featuredAnimes.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [featuredAnimes.length]);

  if (featuredAnimes.length === 0) return null;

  const getHeroImage = (anime: Anime) => anime.banner || anime.posterLarge || anime.poster;

  return (
    <section className="relative h-[75vh] min-h-137.5 max-h-187.5 overflow-hidden">
      {/* Background Images - Stack all slides */}
      <div className="absolute inset-0">
        {featuredAnimes.map((anime, index) => (
          <div
            key={index}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{
              opacity: index === currentIndex ? 1 : 0,
              zIndex: index === currentIndex ? 1 : 0
            }}
          >
            <Image
              src={getHeroImage(anime)}
              alt=""
              fill
              className="object-cover"
              priority={index === 0}
              quality={90}
              sizes="100vw"
            />
          </div>
        ))}

        {/* Gradients overlay */}
        <div className="absolute inset-0 bg-linear-to-r from-[#0f0f0f] via-[#0f0f0f]/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-linear-to-t from-[#0f0f0f] via-transparent to-[#0f0f0f]/40 z-10" />
      </div>

      {/* Content with smooth transition */}
      <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-end pb-20">
        {featuredAnimes.map((anime, index) => {
          const title = anime.titleEnglish || anime.title;
          return (
            <div
              key={index}
              className={`absolute left-4 right-4 sm:left-6 sm:right-6 bottom-20 flex flex-col md:flex-row gap-8 items-end transition-all duration-500 ease-out ${
                index === currentIndex
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4 pointer-events-none'
              }`}
            >
              <div className="hidden md:block shrink-0">
                <div className="relative w-52 aspect-3/4 rounded-xl overflow-hidden shadow-2xl ring-2 ring-white/10">
                  <Image
                    src={anime.posterLarge || anime.poster}
                    alt={title}
                    fill
                    className="object-cover"
                    quality={85}
                  />
                </div>
              </div>

              <div className="flex-1 pb-2">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-violet-600 rounded-full text-xs font-semibold text-white uppercase tracking-wide">
                    Featured
                  </span>
                  {anime.score && (
                    <span className="flex items-center gap-1 text-yellow-400 text-sm font-medium">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {anime.score.toFixed(1)}
                    </span>
                  )}
                  {anime.year && (
                    <span className="text-gray-400 text-sm">{anime.year}</span>
                  )}
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                  {title}
                </h1>

                {anime.genres && anime.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {anime.genres.slice(0, 4).map((genre, i) => (
                      <span key={i} className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/90">
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {anime.description && (
                  <p className="text-gray-300 line-clamp-2 mb-6 max-w-2xl text-sm md:text-base">
                    {anime.description}
                  </p>
                )}

                <div className="flex gap-3">
                  <Link
                    href={`/anime/${anime.malId || anime.id}`}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all hover:scale-105 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Watch Now
                  </Link>
                  <button className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl transition-all flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add to List
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {featuredAnimes.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? 'w-8 h-2 bg-violet-500'
                : 'w-2 h-2 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() => goToSlide((currentIndex - 1 + featuredAnimes.length) % featuredAnimes.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full text-white/70 hover:text-white transition-all hidden md:block"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={() => goToSlide((currentIndex + 1) % featuredAnimes.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full text-white/70 hover:text-white transition-all hidden md:block"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </section>
  );
}

export default function Home() {
  const [seasonalAnime, setSeasonalAnime] = useState<Anime[]>([]);
  const [topAnime, setTopAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [seasonal, top] = await Promise.all([
          getSeasonalAnime(),
          getTopAnime(1, 24)
        ]);
        setSeasonalAnime(seasonal);
        setTopAnime(top);
      } catch (error) {
        console.error('Failed to load anime:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const genres = [
    { name: 'Action', id: 1 },
    { name: 'Adventure', id: 2 },
    { name: 'Comedy', id: 4 },
    { name: 'Drama', id: 8 },
    { name: 'Fantasy', id: 10 },
    { name: 'Romance', id: 22 },
    { name: 'Sci-Fi', id: 24 },
    { name: 'Slice of Life', id: 36 },
    { name: 'Sports', id: 30 },
    { name: 'Horror', id: 14 },
    { name: 'Mystery', id: 7 },
    { name: 'Supernatural', id: 37 },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Header />

      <main>
        {/* Hero Section with Auto-Rotate */}
        {!loading && topAnime.length > 0 && <HeroSection animes={topAnime} />}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                <p className="text-gray-400">Loading anime...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Trending Now - Horizontal Scroll */}
              <HorizontalScroll title="Trending Now">
                {topAnime.slice(0, 12).map((anime) => (
                  <AnimeCardCompact key={anime.malId || anime.id} anime={anime} />
                ))}
              </HorizontalScroll>

              {/* Currently Airing - Horizontal Scroll */}
              <HorizontalScroll title="Currently Airing">
                {seasonalAnime.slice(0, 12).map((anime) => (
                  <AnimeCardCompact key={anime.malId || anime.id} anime={anime} />
                ))}
              </HorizontalScroll>

              {/* Winter 2026 Season - Grid */}
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <span className="w-1 h-6 bg-violet-500 rounded-full" />
                    Winter 2026 Season
                  </h2>
                  <Link href="/seasons" className="text-violet-400 hover:text-violet-300 text-sm font-medium flex items-center gap-1">
                    View All
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {seasonalAnime.slice(0, 18).map((anime, index) => (
                    <AnimeGridCard key={anime.malId || anime.id} anime={anime} index={index} />
                  ))}
                </div>
              </section>

              {/* Top Anime - Grid */}
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <span className="w-1 h-6 bg-violet-500 rounded-full" />
                    Top Rated Anime
                  </h2>
                  <Link href="/catalog" className="text-violet-400 hover:text-violet-300 text-sm font-medium flex items-center gap-1">
                    View All
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {topAnime.slice(0, 18).map((anime, index) => (
                    <AnimeGridCard key={anime.malId || anime.id} anime={anime} index={index} />
                  ))}
                </div>
              </section>

              {/* Genres with SVG Icons */}
              <section className="mb-12">
                <h2 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
                  <span className="w-1 h-6 bg-violet-500 rounded-full" />
                  Browse by Genre
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {genres.map((genre) => (
                    <Link
                      key={genre.id}
                      href={`/catalog?genre=${genre.id}`}
                      className="group flex items-center gap-3 px-4 py-3.5 bg-gray-800/50 hover:bg-violet-600/20 border border-gray-700/50 hover:border-violet-500/50 rounded-xl text-gray-300 hover:text-white transition-all"
                    >
                      <span className="text-violet-400 group-hover:text-violet-300 transition-colors group-hover:scale-110 transform duration-200">
                        {GenreIcons[genre.name] || GenreIcons.Action}
                      </span>
                      <span className="font-medium">{genre.name}</span>
                    </Link>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
