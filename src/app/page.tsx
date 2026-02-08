'use client';

/**
 * ============================================
 * ANIHUB - Main Page
 * ============================================
 * @author warpVIT
 * @created 2026 (probably at 3am lol)
 *
 * ye i know this file is huge, will refactor someday
 * TODO: split into smaller components when i have time
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getTopAnime, getSeasonalAnime } from '@/lib/api';
import type { Anime } from '@/types/anime';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import Link from 'next/link';
import Image from 'next/image';
import clsx from 'clsx';

// switched from inline svg to lucide - much cleaner
import {
  Sword, Compass, Smile, Theater, Sparkles, Heart,
  Rocket, Coffee, Trophy, Skull, Search, Ghost,
  Star, ChevronLeft, ChevronRight, Play, Plus, Loader2
} from 'lucide-react';

// =============================================
// CONSTANTS
// =============================================

// hardcoded cuz jikan is slow af
const GENRES = [
  { name: 'Action', id: 1, icon: Sword },
  { name: 'Adventure', id: 2, icon: Compass },
  { name: 'Comedy', id: 4, icon: Smile },
  { name: 'Drama', id: 8, icon: Theater },
  { name: 'Fantasy', id: 10, icon: Sparkles },
  { name: 'Romance', id: 22, icon: Heart },
  { name: 'Sci-Fi', id: 24, icon: Rocket },
  { name: 'Slice of Life', id: 36, icon: Coffee },
  { name: 'Sports', id: 30, icon: Trophy },
  { name: 'Horror', id: 14, icon: Skull },
  { name: 'Mystery', id: 7, icon: Search },
  { name: 'Supernatural', id: 37, icon: Ghost },
] as const;

// magic numbers that just work, dont touch
const HERO_ROTATE_MS = 7000;
const HERO_TRANSITION_MS = 600;
const SCROLL_PX = 400;

// =============================================
// UTILS (should probably move these but eh)
// =============================================

// simple helper to get anime id - some have malId, some have id
const getAnimeId = (a: Anime) => a.malId || a.id;

// get display title with fallback
const getTitle = (a: Anime) => a.titleEnglish || a.title;

// =============================================
// COMPONENTS
// =============================================

/**
 * Compact anime card for horizontal scrolling sections
 * smaller than the grid version
 */
function CompactCard({ anime }: { anime: Anime }) {
  const title = getTitle(anime);
  const id = getAnimeId(anime);

  return (
    <Link href={`/anime/${id}`} className="group block shrink-0 w-40 sm:w-45">
      <div className="relative aspect-3/4 rounded-xl overflow-hidden bg-gray-800 mb-2">
        <Image
          src={anime.poster}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          sizes="180px"
        />

        {/* hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* score badge - only show if > 0 */}
        {anime.score > 0 && (
          <div className="absolute top-2 left-2 bg-violet-600 px-2 py-0.5 rounded-md text-xs font-bold text-white flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            {anime.score.toFixed(1)}
          </div>
        )}

        {/* episode count */}
        {anime.episodes && (
          <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-xs text-white">
            {anime.episodes} ep
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-violet-400 transition-colors">
        {title}
      </h3>
    </Link>
  );
}

/**
 * Horizontal scroll section with nav buttons
 * FIXME: buttons dont disable at scroll limits - will fix later maybe
 */
function HScroll({ children, title }: { children: React.ReactNode; title: string }) {
  const ref = useRef<HTMLDivElement>(null);

  // ye i could use a lib for this but this works fine
  const scroll = (dir: 'left' | 'right') => {
    ref.current?.scrollBy({
      left: dir === 'left' ? -SCROLL_PX : SCROLL_PX,
      behavior: 'smooth'
    });
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
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
        // inline style cuz tailwind scrollbar-hide doesnt work everywhere
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
    </section>
  );
}

/**
 * Grid card - bigger version with more info
 * has staggered animation based on index
 */
function GridCard({ anime, idx }: { anime: Anime; idx: number }) {
  const title = getTitle(anime);
  const id = getAnimeId(anime);

  return (
    <Link
      href={`/anime/${id}`}
      className="group block animate-fadeIn"
      style={{ animationDelay: `${idx * 50}ms` }}
    >
      <div className="relative aspect-3/4 rounded-xl overflow-hidden bg-gray-800 mb-3 shadow-lg">
        <Image
          src={anime.poster}
          alt={title}
          fill
          className="object-cover transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
        />

        {/* permanent dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* score */}
        {anime.score > 0 && (
          <div className="absolute top-3 left-3 bg-violet-600/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-lg">
            <Star className="w-3.5 h-3.5 fill-current" />
            {anime.score.toFixed(1)}
          </div>
        )}

        {/* type badge */}
        {anime.type && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white uppercase">
            {anime.type}
          </div>
        )}

        {/* bottom meta */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          {anime.genres?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {anime.genres.slice(0, 2).map((g, i) => (
                <span key={i} className="px-2 py-0.5 bg-white/10 backdrop-blur-sm rounded text-[10px] text-white/80">
                  {g}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-300">
            {anime.year && <span>{anime.year}</span>}
            {anime.episodes && (
              <>
                <span className="w-1 h-1 bg-gray-500 rounded-full" />
                <span>{anime.episodes} eps</span>
              </>
            )}
          </div>
        </div>
      </div>

      <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-violet-400 transition-colors leading-tight">
        {title}
      </h3>
    </Link>
  );
}

/**
 * Hero carousel with auto-rotation
 * this was annoying to get smooth lol
 */
function Hero({ animes }: { animes: Anime[] }) {
  const [idx, setIdx] = useState(0);
  const [locked, setLocked] = useState(false);

  // only show top 5
  const featured = useMemo(() => animes.slice(0, 5), [animes]);

  const goTo = useCallback((i: number) => {
    if (locked || i === idx) return;
    setLocked(true);
    setIdx(i);
    // unlock after transition completes
    setTimeout(() => setLocked(false), HERO_TRANSITION_MS);
  }, [locked, idx]);

  // auto rotate
  useEffect(() => {
    if (featured.length <= 1) return;

    const timer = setInterval(() => {
      setIdx(prev => (prev + 1) % featured.length);
    }, HERO_ROTATE_MS);

    return () => clearInterval(timer);
  }, [featured.length]);

  if (!featured.length) return null;

  // prefer banner > posterLarge > poster
  const getHeroImg = (a: Anime) => a.banner || a.posterLarge || a.poster;

  return (
    <section className="relative h-[75vh] min-h-[550px] max-h-[750px] overflow-hidden">
      {/* bg images - all stacked, opacity controls visibility */}
      <div className="absolute inset-0">
        {featured.map((anime, i) => (
          <div
            key={getAnimeId(anime)}
            className={clsx(
              "absolute inset-0 transition-opacity duration-700 ease-in-out",
              i === idx ? "opacity-100 z-[1]" : "opacity-0 z-0"
            )}
          >
            <Image
              src={getHeroImg(anime)}
              alt=""
              fill
              className="object-cover"
              priority={i === 0}
              quality={90}
              sizes="100vw"
            />
          </div>
        ))}

        {/* the gradients that make everything look good */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f]/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-[#0f0f0f]/40 z-10" />
      </div>

      {/* content slides */}
      <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-end pb-20">
        {featured.map((anime, i) => {
          const title = getTitle(anime);
          const id = getAnimeId(anime);

          return (
            <div
              key={id}
              className={clsx(
                "absolute left-4 right-4 sm:left-6 sm:right-6 bottom-20",
                "flex flex-col md:flex-row gap-8 items-end",
                "transition-all duration-500 ease-out",
                i === idx
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4 pointer-events-none"
              )}
            >
              {/* poster thumbnail - desktop only */}
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

              {/* info section */}
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="px-3 py-1 bg-violet-600 rounded-full text-xs font-semibold text-white uppercase tracking-wide">
                    Featured
                  </span>
                  {anime.score > 0 && (
                    <span className="flex items-center gap-1 text-yellow-400 text-sm font-medium">
                      <Star className="w-4 h-4 fill-current" />
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

                {anime.genres?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {anime.genres.slice(0, 4).map((g, j) => (
                      <span
                        key={j}
                        className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/90"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {anime.description && (
                  <p className="text-gray-300 line-clamp-2 mb-6 max-w-2xl text-sm md:text-base">
                    {anime.description}
                  </p>
                )}

                <div className="flex gap-3 flex-wrap">
                  <Link
                    href={`/anime/${id}`}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all hover:scale-105 flex items-center gap-2"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Watch Now
                  </Link>
                  <button className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl transition-all flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add to List
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* dot indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {featured.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={clsx(
              "transition-all duration-300 rounded-full",
              i === idx
                ? "w-8 h-2 bg-violet-500"
                : "w-2 h-2 bg-white/30 hover:bg-white/50"
            )}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* nav arrows - desktop only */}
      <button
        onClick={() => goTo((idx - 1 + featured.length) % featured.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full text-white/70 hover:text-white transition-all hidden md:block"
        aria-label="Previous"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={() => goTo((idx + 1) % featured.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full text-white/70 hover:text-white transition-all hidden md:block"
        aria-label="Next"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </section>
  );
}

/** loading spinner */
function Loader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
        <p className="text-gray-400">Loading anime...</p>
        {/* lil easter egg */}
        <p className="text-gray-600 text-xs mt-2">
          crafted with mass of caffeine by warpVIT
        </p>
      </div>
    </div>
  );
}

// =============================================
// MAIN PAGE
// =============================================

export default function Home() {
  const [seasonal, setSeasonal] = useState<Anime[]>([]);
  const [top, setTop] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false; // prevent state update after unmount

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // parallel fetch - 2x faster
        const [seasonalRes, topRes] = await Promise.all([
          getSeasonalAnime(),
          getTopAnime(1, 24)
        ]);

        if (cancelled) return;

        setSeasonal(seasonalRes);
        setTop(topRes);
      } catch (err) {
        console.error('[Home] failed to load:', err);
        if (!cancelled) {
          setError('something went wrong. pls refresh');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => { cancelled = true; };
  }, []);

  // TODO: add keyboard nav for hero carousel
  // TODO: infinite scroll for grids

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Header />

      <main>
        {/* hero section */}
        {!loading && top.length > 0 && <Hero animes={top} />}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {loading ? (
            <Loader />
          ) : error ? (
            // error state
            <div className="text-center py-20">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white transition-colors"
              >
                try again
              </button>
            </div>
          ) : (
            <>
              {/* trending section */}
              <HScroll title="Trending Now">
                {top.slice(0, 12).map(a => (
                  <CompactCard key={getAnimeId(a)} anime={a} />
                ))}
              </HScroll>

              {/* currently airing */}
              <HScroll title="Currently Airing">
                {seasonal.slice(0, 12).map(a => (
                  <CompactCard key={getAnimeId(a)} anime={a} />
                ))}
              </HScroll>

              {/* seasonal grid */}
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <span className="w-1 h-6 bg-violet-500 rounded-full" />
                    Winter 2026 Season
                  </h2>
                  <Link
                    href="/seasons"
                    className="text-violet-400 hover:text-violet-300 text-sm font-medium flex items-center gap-1 group"
                  >
                    View All
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {seasonal.slice(0, 18).map((a, i) => (
                    <GridCard key={getAnimeId(a)} anime={a} idx={i} />
                  ))}
                </div>
              </section>

              {/* top rated grid */}
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <span className="w-1 h-6 bg-violet-500 rounded-full" />
                    Top Rated
                  </h2>
                  <Link
                    href="/catalog"
                    className="text-violet-400 hover:text-violet-300 text-sm font-medium flex items-center gap-1 group"
                  >
                    View All
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {top.slice(0, 18).map((a, i) => (
                    <GridCard key={getAnimeId(a)} anime={a} idx={i} />
                  ))}
                </div>
              </section>

              {/* genre browser */}
              <section className="mb-12">
                <h2 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
                  <span className="w-1 h-6 bg-violet-500 rounded-full" />
                  Browse by Genre
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {GENRES.map(({ name, id, icon: Icon }) => (
                    <Link
                      key={id}
                      href={`/catalog?genre=${id}`}
                      className="group flex items-center gap-3 px-4 py-3.5 bg-gray-800/50 hover:bg-violet-600/20 border border-gray-700/50 hover:border-violet-500/50 rounded-xl text-gray-300 hover:text-white transition-all"
                    >
                      <Icon className="w-5 h-5 text-violet-400 group-hover:text-violet-300 group-hover:scale-110 transition-all" />
                      <span className="font-medium">{name}</span>
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

      {/* hidden watermark lol */}
      {/* Built by warpVIT - 2026 */}
    </div>
  );
}
