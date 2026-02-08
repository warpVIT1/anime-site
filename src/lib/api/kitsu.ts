import type { Anime } from '@/types/anime';
import type { KitsuAnime, KitsuListResponse } from '@/types/api/kitsu';
import { kitsuLimiter, fetchWithRetry, normalizeScore, normalizeStatus, normalizeType, extractYear } from '@/lib/utils';

const BASE_URL = 'https://kitsu.io/api/edge';

function toAnime(data: KitsuAnime): Anime {
  const attrs = data.attributes;
  return {
    id: parseInt(data.id),
    slug: data.id,
    kitsuId: data.id,
    title: attrs.canonicalTitle,
    titleOriginal: attrs.titles.ja_jp,
    titleEnglish: attrs.titles.en || attrs.titles.en_jp,
    poster: attrs.posterImage?.large || attrs.posterImage?.original || '',
    posterLarge: attrs.posterImage?.original,
    banner: attrs.coverImage?.large || attrs.coverImage?.original,
    description: attrs.synopsis || attrs.description,
    synopsis: attrs.synopsis,
    year: extractYear(attrs.startDate),
    status: normalizeStatus(attrs.status),
    type: normalizeType(attrs.showType),
    episodes: attrs.episodeCount,
    duration: attrs.episodeLength,
    score: normalizeScore(parseFloat(attrs.averageRating || '0'), 100),
    popularity: attrs.popularityRank,
    rank: attrs.ratingRank,
    genres: [],
    studios: [],
    trailer: attrs.youtubeVideoId ? { id: attrs.youtubeVideoId, site: 'youtube' } : undefined,
    source: 'kitsu',
    aired: { from: attrs.startDate, to: attrs.endDate }
  };
}

export async function getAnimeById(id: number): Promise<Anime> {
  await kitsuLimiter.throttle();
  const res = await fetchWithRetry(`${BASE_URL}/anime/${id}`);
  if (!res.ok) throw new Error(`Kitsu error: ${res.status}`);
  const { data }: { data: KitsuAnime } = await res.json();
  return toAnime(data);
}

export async function searchAnime(query: string, limit = 24): Promise<Anime[]> {
  await kitsuLimiter.throttle();
  const params = new URLSearchParams({ 'filter[text]': query, 'page[limit]': String(limit) });
  const res = await fetchWithRetry(`${BASE_URL}/anime?${params}`);
  if (!res.ok) throw new Error(`Kitsu error: ${res.status}`);
  const result: KitsuListResponse<KitsuAnime> = await res.json();
  return result.data.map(toAnime);
}

export async function getTopAnime(limit = 24): Promise<Anime[]> {
  await kitsuLimiter.throttle();
  const params = new URLSearchParams({ 'sort': '-averageRating', 'page[limit]': String(limit) });
  const res = await fetchWithRetry(`${BASE_URL}/anime?${params}`);
  if (!res.ok) throw new Error(`Kitsu error: ${res.status}`);
  const result: KitsuListResponse<KitsuAnime> = await res.json();
  return result.data.map(toAnime);
}

export async function getTrendingAnime(limit = 24): Promise<Anime[]> {
  await kitsuLimiter.throttle();
  const params = new URLSearchParams({ 'page[limit]': String(limit) });
  const res = await fetchWithRetry(`${BASE_URL}/trending/anime?${params}`);
  if (!res.ok) throw new Error(`Kitsu error: ${res.status}`);
  const result: KitsuListResponse<KitsuAnime> = await res.json();
  return result.data.map(toAnime);
}
