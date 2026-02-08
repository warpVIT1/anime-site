// Consumet API - External hosted instance
// Docs: https://docs.consumet.org

import type { Anime } from '@/types/anime';

const API_BASE = 'https://animesite-xi.vercel.app';

interface ConsumetAnime {
  id: string;
  malId?: number;
  title: {
    romaji?: string;
    english?: string;
    native?: string;
    userPreferred?: string;
  };
  image?: string;
  cover?: string;
  description?: string;
  status?: string;
  releaseDate?: number;
  rating?: number;
  genres?: string[];
  totalEpisodes?: number;
  type?: string;
  popularity?: number;
}

interface ConsumetResponse {
  currentPage?: number;
  hasNextPage?: boolean;
  totalPages?: number;
  totalResults?: number;
  results: ConsumetAnime[];
}

function mapToAnime(item: ConsumetAnime): Anime {
  return {
    id: item.id,
    malId: item.malId || parseInt(item.id) || 0,
    title: item.title?.romaji || item.title?.userPreferred || 'Unknown',
    titleEnglish: item.title?.english || item.title?.romaji || '',
    titleOriginal: item.title?.native || '',
    poster: item.image || '',
    posterLarge: item.cover || item.image || '',
    banner: item.cover || '',
    description: item.description?.replace(/<[^>]*>/g, '') || '',
    score: item.rating ? item.rating / 10 : 0,
    year: item.releaseDate || 0,
    genres: item.genres || [],
    studios: [],
    episodes: item.totalEpisodes || 0,
    type: (item.type?.toLowerCase() || 'tv') as 'tv' | 'movie' | 'ova' | 'ona' | 'special' | 'music',
    status: (item.status === 'Completed' ? 'completed' : item.status === 'Ongoing' ? 'ongoing' : 'announced') as 'ongoing' | 'completed' | 'announced',
    popularity: item.popularity || 0,
    source: 'anilist' as const,
  };
}

async function fetchApi(endpoint: string): Promise<any> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    next: { revalidate: 3600 } // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`Consumet API error: ${response.status}`);
  }

  return response.json();
}

export async function getTrendingAnime(page: number = 1, perPage: number = 24): Promise<Anime[]> {
  try {
    const data: ConsumetResponse = await fetchApi(`/meta/anilist/trending?page=${page}&perPage=${perPage}`);
    return data.results?.map(mapToAnime) || [];
  } catch (error) {
    console.warn('[Consumet] Trending failed:', error);
    return [];
  }
}

export async function getPopularAnime(page: number = 1, perPage: number = 24): Promise<Anime[]> {
  try {
    const data: ConsumetResponse = await fetchApi(`/meta/anilist/popular?page=${page}&perPage=${perPage}`);
    return data.results?.map(mapToAnime) || [];
  } catch (error) {
    console.warn('[Consumet] Popular failed:', error);
    return [];
  }
}

export async function getRecentEpisodes(page: number = 1, perPage: number = 24): Promise<Anime[]> {
  try {
    const data: ConsumetResponse = await fetchApi(`/meta/anilist/recent-episodes?page=${page}&perPage=${perPage}`);
    return data.results?.map(mapToAnime) || [];
  } catch (error) {
    console.warn('[Consumet] Recent episodes failed:', error);
    return [];
  }
}

export async function searchAnime(query: string, page: number = 1, perPage: number = 24): Promise<Anime[]> {
  try {
    const data: ConsumetResponse = await fetchApi(`/meta/anilist/${encodeURIComponent(query)}?page=${page}&perPage=${perPage}`);
    return data.results?.map(mapToAnime) || [];
  } catch (error) {
    console.warn('[Consumet] Search failed:', error);
    return [];
  }
}

export async function getAnimeInfo(id: string): Promise<Anime | null> {
  try {
    const data = await fetchApi(`/meta/anilist/info/${id}`);
    return mapToAnime(data);
  } catch (error) {
    console.warn('[Consumet] Info failed:', error);
    return null;
  }
}

export async function getAiringSchedule(page: number = 1, perPage: number = 24): Promise<Anime[]> {
  try {
    const data: ConsumetResponse = await fetchApi(`/meta/anilist/airing-schedule?page=${page}&perPage=${perPage}`);
    return data.results?.map(mapToAnime) || [];
  } catch (error) {
    console.warn('[Consumet] Airing schedule failed:', error);
    return [];
  }
}

// Schedule item with airing info
export interface ScheduleItem {
  id: string;
  malId: number;
  title: string;
  titleEnglish: string;
  poster: string;
  episode: number;
  airingAt: number; // Unix timestamp
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
}

interface AiringScheduleItem {
  id: string;
  malId?: number;
  title: {
    romaji?: string;
    english?: string;
    native?: string;
    userPreferred?: string;
  };
  image?: string;
  episode: number;
  airingAt: number;
}

interface AiringScheduleResponse {
  currentPage?: number;
  hasNextPage?: boolean;
  results: AiringScheduleItem[];
}

// Get weekly airing schedule with time info
export async function getWeeklySchedule(): Promise<ScheduleItem[]> {
  try {
    // Get schedule for the week (fetch more to ensure we have enough)
    const data: AiringScheduleResponse = await fetchApi(`/meta/anilist/airing-schedule?page=1&perPage=100`);

    if (!data.results) return [];

    return data.results.map(item => {
      const date = new Date(item.airingAt * 1000);
      return {
        id: item.id,
        malId: item.malId || parseInt(item.id) || 0,
        title: item.title?.romaji || item.title?.userPreferred || 'Unknown',
        titleEnglish: item.title?.english || item.title?.romaji || '',
        poster: item.image || '',
        episode: item.episode || 1,
        airingAt: item.airingAt,
        dayOfWeek: date.getDay(),
      };
    });
  } catch (error) {
    console.warn('[Consumet] Weekly schedule failed:', error);
    return [];
  }
}

// Advanced search with filters
export async function advancedSearch(params: {
  query?: string;
  type?: string;
  genres?: string[];
  sort?: string[];
  status?: string;
  season?: string;
  year?: number;
  page?: number;
  perPage?: number;
}): Promise<Anime[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.set('query', params.query);
    if (params.type) searchParams.set('type', params.type);
    if (params.genres?.length) searchParams.set('genres', JSON.stringify(params.genres));
    if (params.sort?.length) searchParams.set('sort', JSON.stringify(params.sort));
    if (params.status) searchParams.set('status', params.status);
    if (params.season) searchParams.set('season', params.season);
    if (params.year) searchParams.set('year', params.year.toString());
    searchParams.set('page', (params.page || 1).toString());
    searchParams.set('perPage', (params.perPage || 24).toString());

    const data: ConsumetResponse = await fetchApi(`/meta/anilist/advanced-search?${searchParams}`);
    return data.results?.map(mapToAnime) || [];
  } catch (error) {
    console.warn('[Consumet] Advanced search failed:', error);
    return [];
  }
}
