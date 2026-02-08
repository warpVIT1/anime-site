/**
 * ===============================================
 * Jikan API Client
 * ===============================================
 * @author warpVIT
 *
 * Jikan is an unofficial MyAnimeList API
 * its free but has strict rate limits (3 req/sec)
 *
 * docs: https://docs.api.jikan.moe/
 */

import type { Anime } from '@/types/anime';
import type {
  JikanAnime,
  JikanPaginatedResponse,
  JikanSingleResponse,
  JikanRecommendation
} from '@/types/api/jikan';
import {
  jikanLimiter,
  fetchWithRetry,
  normalizeScore,
  normalizeStatus,
  normalizeType,
  normalizeSeason,
  extractYear
} from '@/lib/utils';

// API endpoints
const JIKAN_API = 'https://api.jikan.moe/v4';
const ANILIST_API = 'https://graphql.anilist.co';
const KITSU_API = 'https://kitsu.io/api/edge';

// ===============================================
// POSTER FALLBACK SYSTEM
// ===============================================

/**
 * try to get a poster image from multiple sources
 *
 * sometimes jikan returns broken images (especially for older anime)
 * this tries jikan first, then anilist, then kitsu
 *
 * the 86400 revalidate = 24 hours cache, these dont change often
 */
async function fetchPosterFallback(malId: number, title: string): Promise<string | undefined> {
  // attempt 1: jikan direct
  try {
    const res = await fetch(`${JIKAN_API}/anime/${malId}`, {
      next: { revalidate: 86400 }
    });

    if (res.ok) {
      const { data }: JikanSingleResponse<JikanAnime> = await res.json();
      const img = data.images?.webp?.large_image_url || data.images?.jpg?.large_image_url;
      if (img) return img;
    }
  } catch {
    // jikan failed, try next
  }

  // attempt 2: anilist graphql
  // they have high quality images and support mal id lookup
  try {
    const query = `
      query ($malId: Int) {
        Media(idMal: $malId, type: ANIME) {
          coverImage { large extraLarge }
        }
      }
    `;

    const res = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { malId } }),
      next: { revalidate: 86400 },
    });

    if (res.ok) {
      const { data } = await res.json();
      const img = data?.Media?.coverImage?.extraLarge || data?.Media?.coverImage?.large;
      if (img) return img;
    }
  } catch {
    // anilist failed too
  }

  // attempt 3: kitsu search by title (last resort)
  // less reliable but sometimes works when others fail
  try {
    const params = new URLSearchParams({
      'filter[text]': title,
      'page[limit]': '1'
    });

    const res = await fetch(`${KITSU_API}/anime?${params}`, {
      next: { revalidate: 86400 }
    });

    if (res.ok) {
      const { data } = await res.json();
      return data?.[0]?.attributes?.posterImage?.large;
    }
  } catch {
    // all sources failed, no poster then
  }

  return undefined;
}

// ===============================================
// DATA TRANSFORMATION
// ===============================================

/**
 * convert jikan response to our Anime type
 * this normalizes all the weird field names jikan uses
 */
function toAnime(data: JikanAnime): Anime {
  // prefer webp > jpg, large > small
  const poster = data.images.webp?.large_image_url
    || data.images.jpg?.large_image_url
    || data.images.jpg?.image_url;

  return {
    id: data.mal_id,
    slug: String(data.mal_id),
    malId: data.mal_id,

    // titles
    title: data.title,
    titleOriginal: data.title_japanese,
    titleEnglish: data.title_english,

    // images
    poster,
    posterLarge: poster,

    // text content
    description: data.synopsis,
    synopsis: data.synopsis,
    background: data.background,

    // metadata
    year: data.year || extractYear(data.aired?.from),
    season: normalizeSeason(data.season),
    status: normalizeStatus(data.status),
    type: normalizeType(data.type),
    episodes: data.episodes,
    duration: data.duration ? parseInt(data.duration, 10) : undefined,

    // scores
    score: normalizeScore(data.score),
    scoredBy: data.scored_by,
    rank: data.rank,
    popularity: data.popularity,

    // taxonomies - merge genres and themes
    genres: [
      ...(data.genres?.map(g => g.name) || []),
      ...(data.themes?.map(t => t.name) || [])
    ],
    studios: data.studios?.map(s => s.name) || [],
    demographics: data.demographics?.map(d => d.name),

    // trailer (youtube only)
    trailer: data.trailer?.youtube_id ? {
      id: data.trailer.youtube_id,
      url: data.trailer.url,
      embedUrl: data.trailer.embed_url,
      site: 'youtube'
    } : undefined,

    // misc
    rating: data.rating,
    sourceType: data.source, // manga, light novel, etc
    source: 'jikan',
    url: data.url,
    aired: { from: data.aired?.from, to: data.aired?.to }
  };
}

// ===============================================
// RELATIONS & SEASONS
// ===============================================

// interfaces for relations data
export interface AnimeRelation {
  relation: string;
  entry: { mal_id: number; type: string; name: string; url: string }[];
}

export interface RelatedAnime {
  id: number;
  title: string;
  type: string;
  relation: string;
  image?: string;
  episodes?: number;
  status?: string;
}

// sort order for relation types
// prequels/sequels first, then side content
const RELATION_ORDER: Record<string, number> = {
  'Prequel': 1,
  'Sequel': 2,
  'Parent story': 3,
  'Side story': 4,
  'Alternative version': 5,
  'Alternative setting': 6,
  'Spin-off': 7,
  'Summary': 8,
  'Full story': 9,
  'Other': 10,
};

/**
 * get related anime with posters
 *
 * this is expensive - makes multiple api calls
 * the staggered requests (150ms apart) help avoid rate limits
 */
export async function getAnimeRelations(id: number): Promise<RelatedAnime[]> {
  await jikanLimiter.throttle();

  try {
    const res = await fetchWithRetry(`${JIKAN_API}/anime/${id}/relations`);
    if (!res.ok) return [];

    const { data: relations }: { data: AnimeRelation[] } = await res.json();

    // extract all anime entries
    const related: RelatedAnime[] = [];
    for (const rel of relations) {
      for (const item of rel.entry) {
        // only include anime, not manga
        if (item.type === 'anime') {
          related.push({
            id: item.mal_id,
            title: item.name,
            type: item.type,
            relation: rel.relation
          });
        }
      }
    }

    // sort by relation priority
    related.sort((a, b) => {
      const orderA = RELATION_ORDER[a.relation] ?? 99;
      const orderB = RELATION_ORDER[b.relation] ?? 99;
      return orderA - orderB;
    });

    // limit to 12 and fetch posters
    // stagger requests to be nice to the api
    const limited = related.slice(0, 12);
    const withPosters = await Promise.all(
      limited.map(async (anime, i) => {
        // wait a bit before each request
        await new Promise(r => setTimeout(r, i * 150));
        const image = await fetchPosterFallback(anime.id, anime.title);
        return { ...anime, image };
      })
    );

    return withPosters;
  } catch (err) {
    console.error('[jikan] getAnimeRelations failed:', err);
    return [];
  }
}

/**
 * get anime seasons (prequels/sequels only)
 *
 * TODO: this overlaps with getAnimeRelations, should probably merge them
 */
export async function getAnimeSeasons(id: number) {
  await jikanLimiter.throttle();

  try {
    const res = await fetchWithRetry(`${JIKAN_API}/anime/${id}/relations`);
    if (!res.ok) return [];

    const { data: relations } = await res.json();
    const seasons: any[] = [];

    for (const rel of relations) {
      // only care about direct sequels/prequels
      if (rel.relation === 'Sequel' || rel.relation === 'Prequel') {
        // rel.entry is an array, grab first item
        // FIXME: this might miss some entries?
        const anime = rel.entry?.[0];
        if (anime) {
          seasons.push({
            id: anime.mal_id,
            number: rel.relation === 'Sequel' ? 2 : 1,
            title: anime.name,
            malId: anime.mal_id,
          });
        }
      }
    }

    return seasons;
  } catch (err) {
    console.error('[jikan] getAnimeSeasons failed:', err);
    return [];
  }
}

// ===============================================
// MAIN API FUNCTIONS
// ===============================================

/**
 * get single anime by MAL id
 * uses the /full endpoint to get everything in one request
 */
export async function getAnimeById(id: number): Promise<Anime> {
  await jikanLimiter.throttle();

  const res = await fetchWithRetry(`${JIKAN_API}/anime/${id}/full`);
  if (!res.ok) {
    throw new Error(`[jikan] getAnimeById failed: ${res.status}`);
  }

  const { data }: JikanSingleResponse<JikanAnime> = await res.json();
  const anime = toAnime(data);

  // try to add seasons info (non-blocking)
  try {
    const seasons = await getAnimeSeasons(id);
    if (seasons.length) {
      anime.seasons = seasons;
    }
  } catch {
    // meh, not critical
  }

  return anime;
}

/**
 * search anime by query string
 */
export async function searchAnime(query: string, limit = 24): Promise<Anime[]> {
  await jikanLimiter.throttle();

  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    order_by: 'popularity',
    sort: 'asc'
  });

  const res = await fetchWithRetry(`${JIKAN_API}/anime?${params}`);
  if (!res.ok) {
    throw new Error(`[jikan] searchAnime failed: ${res.status}`);
  }

  const { data }: JikanPaginatedResponse<JikanAnime> = await res.json();
  return data.map(toAnime);
}

/**
 * get top anime (by score)
 */
export async function getTopAnime(page = 1, limit = 24): Promise<Anime[]> {
  await jikanLimiter.throttle();

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  });

  const res = await fetchWithRetry(`${JIKAN_API}/top/anime?${params}`);
  if (!res.ok) {
    throw new Error(`[jikan] getTopAnime failed: ${res.status}`);
  }

  const { data }: JikanPaginatedResponse<JikanAnime> = await res.json();
  return data.map(toAnime);
}

/**
 * get currently airing anime
 * uses /seasons/now endpoint
 */
export async function getSeasonalAnime(): Promise<Anime[]> {
  await jikanLimiter.throttle();

  const res = await fetchWithRetry(`${JIKAN_API}/seasons/now?limit=24`);
  if (!res.ok) {
    throw new Error(`[jikan] getSeasonalAnime failed: ${res.status}`);
  }

  const { data }: JikanPaginatedResponse<JikanAnime> = await res.json();
  return data.map(toAnime);
}

/**
 * get relations (simplified version)
 * returns basic anime data without posters
 */
export async function getRelations(id: number): Promise<Anime[]> {
  await jikanLimiter.throttle();

  try {
    const res = await fetchWithRetry(`${JIKAN_API}/anime/${id}/relations`);
    if (!res.ok) return [];

    const { data } = await res.json();
    const related: Anime[] = [];

    for (const relation of data || []) {
      for (const entry of relation.entry || []) {
        if (entry.type === 'anime') {
          // minimal anime object
          related.push({
            id: entry.mal_id,
            malId: entry.mal_id,
            title: entry.name,
            titleEnglish: entry.name,
            // FIXME: using mal placeholder, should fetch real poster
            poster: 'https://cdn.myanimelist.net/img/sp/icon/apple-touch-icon-256.png',
            genres: [],
            studios: [],
            status: 'completed',
            type: 'tv',
            source: 'jikan',
            url: entry.url,
          } as Anime);
        }
      }
    }

    return related;
  } catch (err) {
    console.error('[jikan] getRelations failed:', err);
    return [];
  }
}

/**
 * get recommendations for an anime
 */
export async function getRecommendations(id: number): Promise<Anime[]> {
  await jikanLimiter.throttle();

  const res = await fetchWithRetry(`${JIKAN_API}/anime/${id}/recommendations`);
  if (!res.ok) {
    throw new Error(`[jikan] getRecommendations failed: ${res.status}`);
  }

  const { data }: JikanSingleResponse<JikanRecommendation[]> = await res.json();

  // only return first 12, more is overkill
  return data.slice(0, 12).map(rec => ({
    id: rec.entry.mal_id,
    malId: rec.entry.mal_id,
    title: rec.entry.title,
    poster: rec.entry.images.webp?.large_image_url || rec.entry.images.jpg?.large_image_url,
    status: 'completed' as const,
    type: 'tv' as const,
    genres: [],
    studios: [],
    source: 'jikan' as const,
    url: rec.entry.url
  }));
}

/**
 * get anime by genre id
 */
export async function getAnimeByGenre(genreId: number, limit = 24): Promise<Anime[]> {
  await jikanLimiter.throttle();

  const params = new URLSearchParams({
    genres: String(genreId),
    limit: String(limit),
    order_by: 'popularity'
  });

  const res = await fetchWithRetry(`${JIKAN_API}/anime?${params}`);
  if (!res.ok) {
    throw new Error(`[jikan] getAnimeByGenre failed: ${res.status}`);
  }

  const { data }: JikanPaginatedResponse<JikanAnime> = await res.json();
  return data.map(toAnime);
}

// ===============================================
// SCHEDULE
// ===============================================

export interface JikanScheduleItem {
  id: number;
  malId: number;
  title: string;
  titleEnglish: string;
  poster: string;
  score: number;
  members: number;
  episodes: number;
  broadcastDay: string;
  broadcastTime: string;
  status: string;
  genres: string[];
}

/**
 * get weekly schedule
 * uses our api route as proxy to avoid CORS issues
 */
export async function getPopularSchedule(): Promise<JikanScheduleItem[]> {
  try {
    const res = await fetch('/api/schedule');
    if (!res.ok) {
      console.warn('[jikan] schedule fetch failed:', res.status);
      return [];
    }

    const { items } = await res.json();
    return items || [];
  } catch (err) {
    console.error('[jikan] getPopularSchedule error:', err);
    return [];
  }
}

// ===============================================
// thats it folks
// - warpVIT
// ===============================================
