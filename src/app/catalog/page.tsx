'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { searchAnime, getTopAnime, advancedSearch } from '@/lib/api';
import type { Anime } from '@/types/anime';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ScheduleSection from '@/components/catalog/ScheduleSection';
import Link from 'next/link';
import Image from 'next/image';

const GENRES = [
  { id: 0, name: 'All Genres' },
  { id: 1, name: 'Action' },
  { id: 2, name: 'Adventure' },
  { id: 4, name: 'Comedy' },
  { id: 8, name: 'Drama' },
  { id: 10, name: 'Fantasy' },
  { id: 14, name: 'Horror' },
  { id: 7, name: 'Mystery' },
  { id: 22, name: 'Romance' },
  { id: 24, name: 'Sci-Fi' },
  { id: 36, name: 'Slice of Life' },
  { id: 30, name: 'Sports' },
  { id: 37, name: 'Supernatural' },
  { id: 25, name: 'Shoujo' },
  { id: 27, name: 'Shounen' },
  { id: 42, name: 'Seinen' },
  { id: 43, name: 'Josei' },
  { id: 18, name: 'Mecha' },
  { id: 38, name: 'Military' },
  { id: 19, name: 'Music' },
];

const SEASONS = [
  { value: '', name: 'All Seasons' },
  { value: 'winter', name: 'Winter' },
  { value: 'spring', name: 'Spring' },
  { value: 'summer', name: 'Summer' },
  { value: 'fall', name: 'Fall' },
];

const FORMATS = [
  { value: '', name: 'All Formats' },
  { value: 'tv', name: 'TV Series' },
  { value: 'movie', name: 'Movie' },
  { value: 'ova', name: 'OVA' },
  { value: 'ona', name: 'ONA' },
  { value: 'special', name: 'Special' },
];

const STATUSES = [
  { value: '', name: 'All Statuses' },
  { value: 'airing', name: 'Currently Airing' },
  { value: 'complete', name: 'Finished' },
  { value: 'upcoming', name: 'Announced / Upcoming' },
  { value: 'all', name: 'Include Announced' },
];

const SORT_OPTIONS = [
  { value: 'popularity_desc', label: 'Most Popular' },
  { value: 'score_desc', label: 'Top Rated' },
  { value: 'year_desc', label: 'Newest First' },
  { value: 'year_asc', label: 'Oldest First' },
  { value: 'title_asc', label: 'Title (A-Z)' },
  { value: 'title_desc', label: 'Title (Z-A)' },
];

const YEARS = [
  { value: 0, name: 'All Years' },
  ...Array.from({ length: 30 }, (_, i) => {
    const year = 2026 - i;
    return { value: year, name: year.toString() };
  }),
];

// Dropdown Select Component
function SelectDropdown({
  value,
  onChange,
  options,
  placeholder,
  icon,
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  options: { value: string | number; name?: string; label?: string }[];
  placeholder: string;
  icon?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption?.name || selectedOption?.label || placeholder;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full flex items-center gap-2 px-4 py-3 bg-gray-800/80 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg text-left transition-all focus:outline-none focus:border-violet-500"
      >
        {icon && <span className="text-gray-400">{icon}</span>}
        <span className={`flex-1 truncate ${value ? 'text-white' : 'text-gray-400'}`}>
          {displayText}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-700/50 transition-colors ${
                value === option.value ? 'text-violet-400 bg-violet-500/10' : 'text-gray-300'
              }`}
            >
              <span className="truncate">{option.name || option.label}</span>
              {value === option.value && (
                <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Filters Popup Component
function FiltersPopup({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApply,
  onClear,
  resultCount,
}: {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    genre: number;
    season: string;
    year: number;
    format: string;
    status: string;
  };
  onFiltersChange: (filters: any) => void;
  onApply: () => void;
  onClear: () => void;
  resultCount: number;
}) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 p-4"
    >
      <div className="flex flex-col gap-3 mb-6">
        <SelectDropdown
          value={filters.genre}
          onChange={(value) => onFiltersChange({ ...filters, genre: value as number })}
          options={GENRES.map((g) => ({ value: g.id, name: g.name }))}
          placeholder="Genre"
        />
        <SelectDropdown
          value={filters.season}
          onChange={(value) => onFiltersChange({ ...filters, season: value as string })}
          options={SEASONS.map((s) => ({ value: s.value, name: s.name }))}
          placeholder="Season"
        />
        <SelectDropdown
          value={filters.year}
          onChange={(value) => onFiltersChange({ ...filters, year: value as number })}
          options={YEARS.map((y) => ({ value: y.value, name: y.name }))}
          placeholder="Year"
        />
        <SelectDropdown
          value={filters.format}
          onChange={(value) => onFiltersChange({ ...filters, format: value as string })}
          options={FORMATS.map((f) => ({ value: f.value, name: f.name }))}
          placeholder="Format"
        />
        <SelectDropdown
          value={filters.status}
          onChange={(value) => onFiltersChange({ ...filters, status: value as string })}
          options={STATUSES.map((s) => ({ value: s.value, name: s.name }))}
          placeholder="Status"
        />
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => {
            onApply();
            onClose();
          }}
          className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg transition-colors"
        >
          Apply ({resultCount})
        </button>
        <button
          onClick={() => {
            onClear();
            onClose();
          }}
          className="w-full py-2.5 bg-transparent hover:bg-gray-700 text-gray-300 hover:text-white font-medium rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}

function AnimeListCard({ anime }: { anime: Anime }) {
  const displayTitle = anime.titleEnglish || anime.title;
  const animeId = anime.malId || anime.id;

  return (
    <Link href={`/anime/${animeId}`} className="group flex gap-4 p-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-xl transition-all">
      <div className="relative w-24 sm:w-32 aspect-3/4 rounded-lg overflow-hidden bg-gray-800 shrink-0">
        <Image
          src={anime.poster}
          alt={displayTitle}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="128px"
        />
        {anime.score && anime.score > 0 && (
          <div className="absolute top-2 left-2 bg-violet-600/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs font-bold text-white flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {anime.score.toFixed(1)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 py-1">
        <h3 className="text-base font-medium text-white group-hover:text-violet-400 transition-colors line-clamp-2 mb-2">
          {displayTitle}
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mb-2">
          {anime.type && <span className="uppercase">{anime.type}</span>}
          {anime.year && (
            <>
              <span className="w-1 h-1 bg-gray-600 rounded-full" />
              <span>{anime.year}</span>
            </>
          )}
          {anime.episodes && (
            <>
              <span className="w-1 h-1 bg-gray-600 rounded-full" />
              <span>{anime.episodes} ep</span>
            </>
          )}
        </div>
        {anime.genres && anime.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {anime.genres.slice(0, 3).map((genre, i) => (
              <span key={i} className="px-2 py-0.5 bg-gray-700/50 rounded text-xs text-gray-300">
                {genre}
              </span>
            ))}
          </div>
        )}
        {anime.description && (
          <p className="text-sm text-gray-400 line-clamp-3 hidden sm:block">
            {anime.description}
          </p>
        )}
      </div>
    </Link>
  );
}

function AnimeCard({ anime }: { anime: Anime }) {
  const displayTitle = anime.titleEnglish || anime.title;
  const animeId = anime.malId || anime.id;

  return (
    <Link href={`/anime/${animeId}`} className="group block">
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
                <span>{anime.episodes} ep</span>
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

export default function CatalogPage() {
  const searchParams = useSearchParams();
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages] = useState(10);
  const [sortBy, setSortBy] = useState('popularity_desc');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  // Initialize filters from URL params
  const [filters, setFilters] = useState(() => {
    const genre = searchParams.get('genre');
    return {
      genre: genre ? parseInt(genre) : 0,
      season: searchParams.get('season') || '',
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : 0,
      format: searchParams.get('format') || '',
      status: searchParams.get('status') || '',
    };
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Apply search from URL on mount
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch && urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasActiveFilters = filters.genre > 0 || filters.season || filters.year > 0 || filters.format || (filters.status && filters.status !== '');

  const loadAnime = useCallback(async () => {
    setLoading(true);
    try {
      let results: Anime[] = [];

      // Get genre name for API
      const getGenreName = (genreId: number): string | undefined => {
        const genre = GENRES.find(g => g.id === genreId);
        return genre && genre.id !== 0 ? genre.name : undefined;
      };

      // Map sort to API parameter
      const sortMap: Record<string, string[]> = {
        'year_desc': ['START_DATE_DESC'],
        'year_asc': ['START_DATE'],
        'score_desc': ['SCORE_DESC'],
        'score_asc': ['SCORE'],
        'popularity_desc': ['POPULARITY_DESC'],
        'popularity_asc': ['POPULARITY'],
        'title_asc': ['TITLE_ROMAJI'],
        'title_desc': ['TITLE_ROMAJI_DESC'],
      };

      // Status mapping
      const statusMap: Record<string, string> = {
        'upcoming': 'NOT_YET_RELEASED',
        'airing': 'RELEASING',
        'complete': 'FINISHED'
      };

      // Check if filtering for recently released
      if (filters.status === 'recent') {
        // Get recently aired anime (last 2 weeks)
        const today = new Date();
        const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
        
        try {
          results = await advancedSearch({
            perPage: 50,
            page: 1,
            status: 'FINISHED'
          });
          
          // Filter to last 2 weeks
          results = results.filter(anime => {
            if (anime.aired?.from) {
              const airedDate = new Date(anime.aired.from);
              return airedDate >= twoWeeksAgo;
            }
            return false;
          });
        } catch (e) {
          console.warn('Failed to fetch recently released anime');
          results = [];
        }
      } else if (searchQuery.trim()) {
        // Search with query
        results = await searchAnime(searchQuery, 50);
      } else {
        // Check if we need advanced search
        const hasFilters = filters.genre > 0 || filters.year > 0 || filters.format ||
                          (filters.status && filters.status !== '');
        const needsSorting = sortBy !== 'popularity_desc';
        const isDateSort = sortBy === 'year_desc' || sortBy === 'year_asc';

        // For date sorting without status filter, we need to exclude announcements at API level
        const getApiStatus = (): string | undefined => {
          if (filters.status) {
            return statusMap[filters.status];
          }
          // For date sorting, default to RELEASING to avoid getting only announcements
          if (isDateSort) {
            return 'RELEASING';
          }
          return undefined;
        };

        // Map sort to API parameter
        const sortMap: Record<string, string[]> = {
          'year_desc': ['START_DATE_DESC'],
          'year_asc': ['START_DATE'],
          'score_desc': ['SCORE_DESC'],
          'score_asc': ['SCORE'],
          'popularity_desc': ['POPULARITY_DESC'],
          'popularity_asc': ['POPULARITY'],
          'title_asc': ['TITLE_ROMAJI'],
          'title_desc': ['TITLE_ROMAJI_DESC'],
        };

        if (hasFilters || needsSorting) {
          // Use advanced search for filters OR custom sorting
          try {
            results = await advancedSearch({
              year: filters.year > 0 ? filters.year : undefined,
              genres: filters.genre > 0 ? [getGenreName(filters.genre)!] : undefined,
              type: filters.format || undefined,
              status: getApiStatus(),
              page,
              perPage: 50
            });

            // If date sorting with RELEASING returned few results, also get FINISHED anime
            if (isDateSort && !filters.status && results.length < 24) {
              try {
                const finishedResults = await advancedSearch({
                  year: filters.year > 0 ? filters.year : undefined,
                  genres: filters.genre > 0 ? [getGenreName(filters.genre)!] : undefined,
                  type: filters.format || undefined,
                  status: 'FINISHED',
                  page,
                  perPage: 50
                });
                // Merge and remove duplicates
                const existingIds = new Set(results.map(a => a.malId || a.id));
                const newResults = finishedResults.filter(a => !existingIds.has(a.malId || a.id));
                results = [...results, ...newResults];
              } catch (e) {
                console.warn('Failed to fetch finished anime');
              }
            }
          } catch (e) {
            console.warn('Advanced search failed, using fallback');
          }

          // Fallback to getTopAnime if advancedSearch returned nothing
          if (!results || results.length === 0) {
            results = await getTopAnime(page, 50);
          }
        } else {
          // Default - get popular anime
          results = await getTopAnime(page, 50);
        }
      }

      // Filter out announcements by default (unless "upcoming" or "all" selected)
      const showAnnouncements = filters.status === 'upcoming' || filters.status === 'all';
      if (!showAnnouncements && results.length > 0) {
        results = results.filter(anime => {
          const status = (anime.status || '').toLowerCase();
          const isAnnounced = status.includes('not yet') ||
                             status.includes('not_yet') ||
                             status === 'not yet released';
          return !isAnnounced;
        });
      }

      // Client-side sorting as backup
      const [sortField, sortDir] = sortBy.split('_');
      results.sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'year':
            comparison = (a.year || 0) - (b.year || 0);
            break;
          case 'score':
            comparison = (a.score || 0) - (b.score || 0);
            break;
          case 'popularity':
            comparison = (b.popularity || 999999) - (a.popularity || 999999);
            break;
          case 'title':
            comparison = (a.titleEnglish || a.title).localeCompare(b.titleEnglish || b.title);
            break;
        }
        return sortDir === 'desc' ? -comparison : comparison;
      });

      // Limit to 24 per page
      setAnimeList(results.slice(0, 24));
    } catch (error) {
      console.error('Failed to load anime:', error);
      setAnimeList([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters, sortBy, searchQuery]);

  useEffect(() => {
    loadAnime();
  }, [loadAnime]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadAnime();
  };

  const clearFilters = () => {
    setFilters({
      genre: 0,
      season: '',
      year: 0,
      format: '',
      status: '',
    });
    setSearchQuery('');
    setPage(1);
  };

  const selectedSortOption = SORT_OPTIONS.find((opt) => opt.value === sortBy);

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Anime Catalog</h1>
          <p className="text-gray-400">Discover your next favorite anime</p>
        </div>

        {/* Schedule Section */}
        <ScheduleSection isOpen={true} />

        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anime..."
                className="w-full px-4 py-3 pl-12 bg-gray-800/80 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </form>

          {/* Sort Dropdown */}
          <div ref={sortDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="flex items-center gap-2 px-4 py-3 bg-gray-800/80 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg transition-all focus:outline-none focus:border-violet-500 min-w-70"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m2-4v12m0 0l-3-3m3 3l3-3" />
              </svg>
              <span className="flex-1 text-white text-left truncate">{selectedSortOption?.label}</span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {sortDropdownOpen && (
              <div className="absolute z-50 mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSortBy(option.value);
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-700/50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      sortBy === option.value ? 'text-violet-400 bg-violet-500/10' : 'text-gray-300'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {sortBy === option.value && (
                      <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filters Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`p-3 rounded-lg border transition-all focus:outline-none ${
                filtersOpen || hasActiveFilters
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-gray-800/80 hover:bg-gray-800 border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                <circle cx="9" cy="8" r="2" fill="currentColor" stroke="currentColor" strokeWidth={1} />
                <circle cx="15" cy="16" r="2" fill="currentColor" stroke="currentColor" strokeWidth={1} />
              </svg>
            </button>

            <FiltersPopup
              isOpen={filtersOpen}
              onClose={() => setFiltersOpen(false)}
              filters={filters}
              onFiltersChange={setFilters}
              onApply={loadAnime}
              onClear={clearFilters}
              resultCount={animeList.length}
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1.5 bg-gray-800/80 border border-gray-700 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Active Filters Pills */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-6">
            {filters.genre > 0 && (
              <span className="px-3 py-1.5 bg-violet-600/20 border border-violet-500/30 rounded-full text-sm text-violet-300 flex items-center gap-2">
                {GENRES.find((g) => g.id === filters.genre)?.name}
                <button onClick={() => setFilters({ ...filters, genre: 0 })} className="hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {filters.season && (
              <span className="px-3 py-1.5 bg-violet-600/20 border border-violet-500/30 rounded-full text-sm text-violet-300 flex items-center gap-2">
                {SEASONS.find((s) => s.value === filters.season)?.name}
                <button onClick={() => setFilters({ ...filters, season: '' })} className="hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {filters.year > 0 && (
              <span className="px-3 py-1.5 bg-violet-600/20 border border-violet-500/30 rounded-full text-sm text-violet-300 flex items-center gap-2">
                {filters.year}
                <button onClick={() => setFilters({ ...filters, year: 0 })} className="hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {filters.format && (
              <span className="px-3 py-1.5 bg-violet-600/20 border border-violet-500/30 rounded-full text-sm text-violet-300 flex items-center gap-2">
                {FORMATS.find((f) => f.value === filters.format)?.name}
                <button onClick={() => setFilters({ ...filters, format: '' })} className="hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {filters.status && (
              <span className="px-3 py-1.5 bg-violet-600/20 border border-violet-500/30 rounded-full text-sm text-violet-300 flex items-center gap-2">
                {STATUSES.find((s) => s.value === filters.status)?.name}
                <button onClick={() => setFilters({ ...filters, status: '' })} className="hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Results Count */}
        {!loading && (
          <div className="mb-6 text-gray-400 text-sm">
            {animeList.length} results found
          </div>
        )}

        {/* Anime Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              <p className="text-gray-400">Loading anime...</p>
            </div>
          </div>
        ) : animeList.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {animeList.map((anime) => (
                <AnimeCard key={anime.malId || anime.id} anime={anime} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {animeList.map((anime) => (
                <AnimeListCard key={anime.malId || anime.id} anime={anime} />
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg
              className="w-16 h-16 text-gray-600 mb-4"
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
            <p className="text-gray-400 mb-4">Try adjusting your filters or search query</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && animeList.length > 0 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
