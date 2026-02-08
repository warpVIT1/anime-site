/**
 * Shikimori API helper functions
 */

const SHIKIMORI_BASE = 'https://shikimori.one/api';
const SHIKIMORI_URL = 'https://shikimori.one';
const USER_AGENT = 'AnimeApp/1.0';

interface ShikimoriAnime {
  id: number;
  name: string;
  russian: string;
  image: {
    original: string;
    preview: string;
    x96: string;
    x48: string;
  };
  url: string;
  kind: string;
  score: number;
  status: string;
  aired_on: string;
  released_on: string;
  episodes: number;
  episodes_aired: number;
  rating: string;
  english?: string[];
  synonyms?: string[];
  license_name_ru?: string;
  description?: string;
  franchise?: string;
  favoured: boolean;
  anons: boolean;
  ongoing: boolean;
  thread_id?: number;
  topic_id?: number;
  myanimelist_id?: number;
  rates_scores_stats?: Array<{ score: number; count: number }>;
  rates_statuses_stats?: Array<{ status: string; count: number }>;
  updated_at?: string;
  next_episode_at?: string;
  season?: string;
  studios?: Array<{ id: number; name: string; filtered_name: string; real_name: string; image: string }>;
  producers?: Array<{ id: number; name: string; filtered_name: string; real_name: string; image: string }>;
  directorss?: any[];
  genres?: Array<{ id: number; name: string; russian: string; kind: string }>;
}

/**
 * Fetch anime by season from Shikimori API
 */
export async function getAnimeBySeasonShikimori(
  year: number,
  season: string,
  limit: number = 50
): Promise<ShikimoriAnime[]> {
  try {
    const seasonLower = season.toLowerCase();
    const response = await fetch(
      `${SHIKIMORI_BASE}/animes?season=${year}_${seasonLower}&limit=${limit}&order=popularity`,
      {
        headers: {
          'User-Agent': USER_AGENT,
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch ${season} ${year}:`, response.status);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error fetching ${season} ${year} from Shikimori:`, error);
    return [];
  }
}

/**
 * Search anime by name
 */
export async function searchAnimeShikimori(query: string, limit: number = 50): Promise<ShikimoriAnime[]> {
  try {
    const response = await fetch(
      `${SHIKIMORI_BASE}/animes?search=${encodeURIComponent(query)}&limit=${limit}`,
      {
        headers: {
          'User-Agent': USER_AGENT,
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error searching anime on Shikimori:', error);
    return [];
  }
}

/**
 * Get currently airing anime
 */
export async function getAiringAnimeShikimori(limit: number = 50): Promise<ShikimoriAnime[]> {
  try {
    const response = await fetch(
      `${SHIKIMORI_BASE}/animes?status=ongoing&limit=${limit}&order=popularity`,
      {
        headers: {
          'User-Agent': USER_AGENT,
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching airing anime from Shikimori:', error);
    return [];
  }
}

/**
 * Get anime by day of week
 */
export async function getAnimeByDayShikimori(day: string, limit: number = 50): Promise<ShikimoriAnime[]> {
  try {
    // Shikimori doesn't have direct schedule API, so we fetch ongoing and filter
    const response = await fetch(
      `${SHIKIMORI_BASE}/animes?status=ongoing&limit=${limit}&order=popularity`,
      {
        headers: {
          'User-Agent': USER_AGENT,
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching schedule from Shikimori:', error);
    return [];
  }
}

/**
 * Convert Shikimori anime to standard format
 */
export function convertShikimoriToStandard(anime: ShikimoriAnime) {
  // Ensure image URLs are absolute
  let poster = '';
  if (anime.image?.original) {
    poster = anime.image.original.startsWith('http') 
      ? anime.image.original 
      : `${SHIKIMORI_URL}${anime.image.original}`;
  } else if (anime.image?.preview) {
    poster = anime.image.preview.startsWith('http')
      ? anime.image.preview
      : `${SHIKIMORI_URL}${anime.image.preview}`;
  }
  
  return {
    id: anime.id.toString(),
    mal_id: anime.myanimelist_id || anime.id,
    title: anime.russian || anime.name,
    title_english: anime.english?.[0] || anime.name,
    poster: poster,
    score: anime.score || 0,
    genres: anime.genres?.map((g) => g.russian || g.name) || [],
    status: anime.status,
    episodes: anime.episodes || 0,
    aired_on: anime.aired_on,
    next_episode_at: anime.next_episode_at,
  };
}
