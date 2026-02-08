// Kitsu API клієнт

import type { Anime } from '@/types/anime';
import type { KitsuAnime, KitsuListResponse } from '@/types/api/kitsu';
import { kitsuLimiter, fetchWithRetry, normalizeScore, normalizeStatus, normalizeType, extractYear } from '@/lib/utils';

const KITSU_BASE_URL = 'https://kitsu.io/api/edge';

// Конвертувати Kitsu дані в універсальний формат
function convertKitsuToAnime(data: KitsuAnime): Anime {
  const numId = parseInt(data.id);
  return {
    id: numId,
    slug: data.id,
    kitsuId: data.id,

    title: data.attributes.canonicalTitle,
    titleOriginal: data.attributes.titles.ja_jp,
    titleEnglish: data.attributes.titles.en || data.attributes.titles.en_jp,

    poster: data.attributes.posterImage?.large || data.attributes.posterImage?.original || '',
    posterLarge: data.attributes.posterImage?.original,
    banner: data.attributes.coverImage?.large || data.attributes.coverImage?.original,

    description: data.attributes.synopsis || data.attributes.description,
    synopsis: data.attributes.synopsis,

    year: extractYear(data.attributes.startDate),
    status: normalizeStatus(data.attributes.status),
    type: normalizeType(data.attributes.showType),

    episodes: data.attributes.episodeCount,
    duration: data.attributes.episodeLength,

    score: normalizeScore(parseFloat(data.attributes.averageRating || '0'), 100),
    popularity: data.attributes.popularityRank,
    rank: data.attributes.ratingRank,

    genres: [],
    studios: [],

    trailer: data.attributes.youtubeVideoId ? {
      id: data.attributes.youtubeVideoId,
      site: 'youtube'
    } : undefined,

    source: 'kitsu',
    aired: {
      from: data.attributes.startDate,
      to: data.attributes.endDate
    }
  };
}

// Отримати аніме за ID
export async function getAnimeById(id: number): Promise<Anime> {
  await kitsuLimiter.throttle();

  const response = await fetchWithRetry(`${KITSU_BASE_URL}/anime/${id}`);

  if (!response.ok) {
    throw new Error(`Kitsu API error: ${response.status}`);
  }

  const result: { data: KitsuAnime } = await response.json();
  return convertKitsuToAnime(result.data);
}

// Пошук аніме
export async function searchAnime(query: string, limit: number = 24): Promise<Anime[]> {
  await kitsuLimiter.throttle();

  const params = new URLSearchParams({
    'filter[text]': query,
    'page[limit]': limit.toString()
  });

  const response = await fetchWithRetry(`${KITSU_BASE_URL}/anime?${params}`);

  if (!response.ok) {
    throw new Error(`Kitsu API error: ${response.status}`);
  }

  const result: KitsuListResponse<KitsuAnime> = await response.json();
  return result.data.map(convertKitsuToAnime);
}

// Топ аніме
export async function getTopAnime(limit: number = 24): Promise<Anime[]> {
  await kitsuLimiter.throttle();

  const params = new URLSearchParams({
    'sort': '-averageRating',
    'page[limit]': limit.toString()
  });

  const response = await fetchWithRetry(`${KITSU_BASE_URL}/anime?${params}`);

  if (!response.ok) {
    throw new Error(`Kitsu API error: ${response.status}`);
  }

  const result: KitsuListResponse<KitsuAnime> = await response.json();
  return result.data.map(convertKitsuToAnime);
}

// Тренди
export async function getTrendingAnime(limit: number = 24): Promise<Anime[]> {
  await kitsuLimiter.throttle();

  const params = new URLSearchParams({
    'page[limit]': limit.toString()
  });

  const response = await fetchWithRetry(`${KITSU_BASE_URL}/trending/anime?${params}`);

  if (!response.ok) {
    throw new Error(`Kitsu API error: ${response.status}`);
  }

  const result: KitsuListResponse<KitsuAnime> = await response.json();
  return result.data.map(convertKitsuToAnime);
}
