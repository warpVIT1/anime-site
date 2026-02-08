/**
 * Application Configuration
 * Centralized configuration for the anime site
 */

// API Configuration
export const API_CONFIG = {
  JIKAN: {
    BASE_URL: 'https://api.jikan.moe/v4',
    TIMEOUT: 10000,
    CACHE_TTL: 3600, // 1 hour
  },
  ANILIST: {
    BASE_URL: 'https://graphql.anilist.co',
    TIMEOUT: 10000,
    CACHE_TTL: 3600,
  },
  KITSU: {
    BASE_URL: 'https://kitsu.io/api/edge',
    TIMEOUT: 10000,
    CACHE_TTL: 3600,
  },
  CONSUMET: {
    BASE_URL: 'https://api.consumet.org/anime',
    TIMEOUT: 10000,
    CACHE_TTL: 1800, // 30 minutes
  },
} as const;

// Site Configuration
export const SITE_CONFIG = {
  NAME: process.env.NEXT_PUBLIC_SITE_NAME || 'ANIHUB',
  URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  DESCRIPTION: 'The largest anime collection. Watch your favorite series and movies with high quality streaming.',
  LANGUAGE: 'en',
} as const;

// Page Configuration
export const PAGE_CONFIG = {
  ITEMS_PER_PAGE: 20,
  CATALOG_ITEMS_PER_PAGE: 24,
  SEARCH_DEBOUNCE_MS: 300,
  IMAGE_PLACEHOLDER: '/anime-placeholder.svg',
} as const;

// Feature Flags
export const FEATURES = {
  ENABLE_CACHE: true,
  ENABLE_TRANSLATIONS: true,
  ENABLE_RANDOM_ANIME: true,
  ENABLE_SCHEDULE: true,
  ENABLE_FALLBACK_SOURCES: true,
} as const;

// Genres
export const GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
] as const;

export type Genre = (typeof GENRES)[number];
