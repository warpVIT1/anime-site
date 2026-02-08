// Unified API interface with multiple sources

import type { Anime } from '@/types/anime';
import * as jikan from './jikan';
import * as anilist from './anilist';
import * as kitsu from './kitsu';
import * as consumet from './consumet';
import { processAnime } from '../translateAnime';

// Error logging
function logError(source: string, error: unknown) {
  console.warn(`[API] ${source} failed:`, error);
}

// Process single anime with translation
function processAnimeResult(anime: Anime): Anime {
  return processAnime(anime);
}

// Process multiple anime with translations
function processAnimeResults(animeList: Anime[]): Anime[] {
  return animeList.map(processAnime);
}

// Get anime by ID with fallback
export async function getAnimeById(id: number): Promise<Anime> {
  let anime: Anime | null = null;

  // Try Jikan first (most complete data)
  try {
    anime = await jikan.getAnimeById(id);
  } catch (error) {
    logError('Jikan', error);
  }

  // Try AniList if Jikan failed
  if (!anime) {
    try {
      anime = await anilist.getAnimeById(id);
    } catch (error) {
      logError('AniList', error);
    }
  }

  // Last resort - Kitsu
  if (!anime) {
    try {
      anime = await kitsu.getAnimeById(id);
    } catch (error) {
      logError('Kitsu', error);
      throw new Error(`Failed to fetch anime ${id} from all sources`);
    }
  }

  return processAnimeResult(anime);
}

// Search anime with fallback - Consumet first for best results
export async function searchAnime(query: string, limit: number = 24): Promise<Anime[]> {
  let results: Anime[] = [];

  // Consumet first - aggregates multiple sources
  try {
    results = await consumet.searchAnime(query, 1, limit);
    if (results.length > 0) {
      return processAnimeResults(results);
    }
  } catch (error) {
    logError('Consumet search', error);
  }

  // Try Jikan
  try {
    results = await jikan.searchAnime(query, limit);
    if (results.length > 0) {
      return processAnimeResults(results);
    }
  } catch (error) {
    logError('Jikan search', error);
  }

  // Then AniList
  try {
    results = await anilist.searchAnime(query, limit);
    if (results.length > 0) {
      return processAnimeResults(results);
    }
  } catch (error) {
    logError('AniList search', error);
  }

  // Finally Kitsu
  try {
    results = await kitsu.searchAnime(query, limit);
    return processAnimeResults(results);
  } catch (error) {
    logError('Kitsu search', error);
    return [];
  }
}

// Top anime with fallback - Consumet first for largest database
export async function getTopAnime(page: number = 1, limit: number = 24): Promise<Anime[]> {
  let results: Anime[] = [];

  // Consumet first - largest database with covers
  try {
    results = await consumet.getPopularAnime(page, limit);
    if (results.length > 0) {
      return processAnimeResults(results);
    }
  } catch (error) {
    logError('Consumet popular', error);
  }

  // AniList fallback - has banner images
  try {
    results = await anilist.getTopAnime(limit);
    if (results.length > 0) {
      return processAnimeResults(results);
    }
  } catch (error) {
    logError('AniList top', error);
  }

  // Fallback to Jikan
  try {
    results = await jikan.getTopAnime(page, limit);
    return processAnimeResults(results);
  } catch (error) {
    logError('Jikan top', error);
  }

  try {
    results = await kitsu.getTopAnime(limit);
    return processAnimeResults(results);
  } catch (error) {
    logError('Kitsu top', error);
    return [];
  }
}

// Current season with fallback
export async function getSeasonalAnime(): Promise<Anime[]> {
  let results: Anime[] = [];

  try {
    results = await jikan.getSeasonalAnime();
    return processAnimeResults(results);
  } catch (error) {
    logError('Jikan seasonal', error);
  }

  try {
    results = await anilist.getSeasonalAnime();
    return processAnimeResults(results);
  } catch (error) {
    logError('AniList seasonal', error);
    return [];
  }
}

// Trending anime - Consumet first
export async function getTrendingAnime(page: number = 1, limit: number = 24): Promise<Anime[]> {
  try {
    const results = await consumet.getTrendingAnime(page, limit);
    if (results.length > 0) {
      return processAnimeResults(results);
    }
  } catch (error) {
    logError('Consumet trending', error);
  }

  // Fallback to Kitsu
  try {
    const results = await kitsu.getTrendingAnime();
    return processAnimeResults(results);
  } catch (error) {
    logError('Kitsu trending', error);
    return getTopAnime(1, limit);
  }
}

// Recommendations (Jikan only) with processing
export async function getRecommendations(id: number): Promise<Anime[]> {
  try {
    const results = await jikan.getRecommendations(id);
    return processAnimeResults(results);
  } catch (error) {
    logError('Jikan recommendations', error);
    return [];
  }
}

// Related anime - all seasons, sequels, prequels
export async function getRelatedAnime(id: number) {
  try {
    return await jikan.getAnimeRelations(id);
  } catch (error) {
    logError('Jikan relations', error);
    return [];
  }
}

// Anime by genre (Jikan only) with processing
export async function getAnimeByGenre(genreId: number, limit: number = 24): Promise<Anime[]> {
  try {
    const results = await jikan.getAnimeByGenre(genreId, limit);
    return processAnimeResults(results);
  } catch (error) {
    logError('Jikan by genre', error);
    return [];
  }
}

// Get random anime
export async function getRandomAnime(count: number = 1): Promise<Anime[]> {
  try {
    const topAnime = await getTopAnime(1, 100);
    const shuffled = topAnime.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  } catch (error) {
    logError('Random anime', error);
    return [];
  }
}

// Recent episodes with new releases
export async function getRecentEpisodes(page: number = 1, limit: number = 24): Promise<Anime[]> {
  try {
    const results = await consumet.getRecentEpisodes(page, limit);
    return processAnimeResults(results);
  } catch (error) {
    logError('Consumet recent', error);
    return getSeasonalAnime();
  }
}

// Advanced search with filters (Consumet)
export async function advancedSearch(params: {
  query?: string;
  type?: string;
  genres?: string[];
  status?: string;
  season?: string;
  year?: number;
  page?: number;
  perPage?: number;
}): Promise<Anime[]> {
  try {
    const results = await consumet.advancedSearch(params);
    return processAnimeResults(results);
  } catch (error) {
    logError('Consumet advanced search', error);
    // Fallback to basic search
    if (params.query) {
      return searchAnime(params.query, params.perPage || 24);
    }
    return getTopAnime(params.page || 1, params.perPage || 24);
  }
}

// Get weekly schedule (Consumet - all airing)
export async function getWeeklySchedule() {
  try {
    return await consumet.getWeeklySchedule();
  } catch (error) {
    logError('Consumet weekly schedule', error);
    return [];
  }
}

// Get popular anime schedule (Jikan - top ongoing only)
export async function getPopularSchedule() {
  try {
    return await jikan.getPopularSchedule();
  } catch (error) {
    logError('Jikan popular schedule', error);
    return [];
  }
}

// Re-export schedule types
export type { ScheduleItem } from './consumet';
export type { JikanScheduleItem } from './jikan';

// Export individual APIs for direct access
export { jikan, anilist, kitsu, consumet };
