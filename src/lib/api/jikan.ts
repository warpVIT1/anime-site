// Jikan API клієнт (MyAnimeList unofficial API)

import type { Anime } from '@/types/anime';
import type { JikanAnime, JikanPaginatedResponse, JikanSingleResponse, JikanRecommendation } from '@/types/api/jikan';
import { jikanLimiter, fetchWithRetry, normalizeScore, normalizeStatus, normalizeType, normalizeSeason, extractYear } from '@/lib/utils';

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
const ANILIST_BASE_URL = 'https://graphql.anilist.co';
const KITSU_BASE_URL = 'https://kitsu.io/api/edge';

// Отримати картинку аніме з fallback через різні API
async function getAnimeImageWithFallback(malId: number, title: string): Promise<string | undefined> {
  // 1. Спробувати Jikan
  try {
    const response = await fetch(`${JIKAN_BASE_URL}/anime/${malId}`, {
      next: { revalidate: 86400 },
    });
    if (response.ok) {
      const data: JikanSingleResponse<JikanAnime> = await response.json();
      const image = data.data.images?.webp?.large_image_url || 
                   data.data.images?.webp?.image_url || 
                   data.data.images?.jpg?.large_image_url ||
                   data.data.images?.jpg?.image_url;
      if (image) return image;
    }
  } catch {}

  // 2. Спробувати AniList через MAL ID
  try {
    const query = `
      query ($malId: Int) {
        Media(idMal: $malId, type: ANIME) {
          coverImage { large extraLarge }
        }
      }
    `;
    const response = await fetch(ANILIST_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { malId } }),
      next: { revalidate: 86400 },
    });
    if (response.ok) {
      const data = await response.json();
      const image = data.data?.Media?.coverImage?.extraLarge || data.data?.Media?.coverImage?.large;
      if (image) return image;
    }
  } catch {}

  // 3. Спробувати Kitsu пошуком за назвою
  try {
    const params = new URLSearchParams({ 'filter[text]': title, 'page[limit]': '1' });
    const response = await fetch(`${KITSU_BASE_URL}/anime?${params}`, {
      next: { revalidate: 86400 },
    });
    if (response.ok) {
      const data = await response.json();
      const image = data.data?.[0]?.attributes?.posterImage?.large || 
                   data.data?.[0]?.attributes?.posterImage?.original;
      if (image) return image;
    }
  } catch {}

  return undefined;
}

// Конвертувати Jikan дані в універсальний формат
function convertJikanToAnime(data: JikanAnime): Anime {
  return {
    id: data.mal_id,
    slug: data.mal_id.toString(),
    malId: data.mal_id,

    title: data.title,
    titleOriginal: data.title_japanese,
    titleEnglish: data.title_english,

    poster: data.images.webp.large_image_url || data.images.jpg.large_image_url,
    posterLarge: data.images.webp.large_image_url || data.images.jpg.large_image_url,

    description: data.synopsis,
    synopsis: data.synopsis,
    background: data.background,

    year: data.year || extractYear(data.aired.from),
    season: normalizeSeason(data.season),
    status: normalizeStatus(data.status),
    type: normalizeType(data.type),

    episodes: data.episodes,
    duration: data.duration ? parseInt(data.duration) : undefined,

    score: normalizeScore(data.score),
    scoredBy: data.scored_by,
    rank: data.rank,
    popularity: data.popularity,

    genres: [
      ...(data.genres?.map(g => g.name) || []),
      ...(data.themes?.map(t => t.name) || [])
    ],
    studios: data.studios?.map(s => s.name) || [],
    demographics: data.demographics?.map(d => d.name),

    trailer: data.trailer?.youtube_id ? {
      id: data.trailer.youtube_id,
      url: data.trailer.url,
      embedUrl: data.trailer.embed_url,
      site: 'youtube'
    } : undefined,

    rating: (data as any).rating,        // Віковий рейтинг
    sourceType: (data as any).source,    // Джерело (Manga, Light novel, etc)

    source: 'jikan',
    url: data.url,
    aired: {
      from: data.aired.from,
      to: data.aired.to,
    }
  };
}

// Типи зв'язків аніме
export interface AnimeRelation {
  relation: string;
  entry: {
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }[];
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

// Отримати пов'язані аніме
export async function getAnimeRelations(id: number): Promise<RelatedAnime[]> {
  await jikanLimiter.throttle();

  try {
    const response = await fetchWithRetry(`${JIKAN_BASE_URL}/anime/${id}/relations`);

    if (!response.ok) {
      return [];
    }

    const result: { data: AnimeRelation[] } = await response.json();
    const relations = result.data || [];

    // Мапа для сортування зв'язків
    const relationOrder: Record<string, number> = {
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

    const relatedAnime: RelatedAnime[] = [];

    for (const rel of relations) {
      for (const item of rel.entry) {
        // Тільки аніме (пропускаємо мангу і т.д.)
        if (item.type === 'anime') {
          relatedAnime.push({
            id: item.mal_id,
            title: item.name,
            type: item.type,
            relation: rel.relation,
          });
        }
      }
    }

    // Сортуємо за пріоритетом зв'язку
    relatedAnime.sort((a, b) => {
      const orderA = relationOrder[a.relation] || 100;
      const orderB = relationOrder[b.relation] || 100;
      return orderA - orderB;
    });

    // Отримуємо картинки паралельно з fallback через різні API
    const limitedAnime = relatedAnime.slice(0, 12);
    
    // Паралельно отримуємо картинки (з невеликою затримкою для уникнення rate limit)
    const enrichedPromises = limitedAnime.map(async (anime, index) => {
      // Невелика затримка для розподілу запитів
      await new Promise(resolve => setTimeout(resolve, index * 150));
      
      const image = await getAnimeImageWithFallback(anime.id, anime.title);
      return {
        ...anime,
        image,
      };
    });

    const enrichedRelations = await Promise.all(enrichedPromises);
    return enrichedRelations;
  } catch (error) {
    console.error('Error fetching anime relations:', error);
    return [];
  }
}

// Отримати сезони аніме
export async function getAnimeSeasons(id: number) {
  await jikanLimiter.throttle();

  try {
    const response = await fetchWithRetry(`${JIKAN_BASE_URL}/anime/${id}/relations`);

    if (!response.ok) {
      return [];
    }

    const result: any = await response.json();
    const relations = result.data || [];

    // Фільтруємо Prequel та Sequel для побудови всіх сезонів
    const seasonsList: any[] = [];
    const visited = new Set<number>();

    // Функція для рекурсивного знаходження всіх сезонів
    const findAllSeasons = (currentId: number, isSequel: boolean = false): any[] => {
      if (visited.has(currentId)) return [];
      visited.add(currentId);

      const currentRelations = relations.filter((rel: any) => {
        if (rel.entry.mal_id !== currentId) return false;
        return rel.relation === 'Sequel' || rel.relation === 'Prequel';
      });

      return currentRelations.flatMap((rel: any) => {
        const anime = rel.entry;
        return {
          id: anime.mal_id,
          number: rel.relation === 'Sequel' ? 2 : 1,
          title: anime.title,
          year: anime.year,
          episodes: anime.episodes,
          score: anime.score,
          status: anime.status,
          malId: anime.mal_id,
        };
      });
    };

    // Збираємо всі сезони
    relations.forEach((rel: any) => {
      if (rel.relation === 'Sequel' || rel.relation === 'Prequel') {
        const anime = rel.entry;
        seasonsList.push({
          id: anime.mal_id,
          number: rel.relation === 'Sequel' ? 2 : 1,
          title: anime.title,
          year: anime.year,
          episodes: anime.episodes,
          score: anime.score,
          status: anime.status,
          malId: anime.mal_id,
        });
      }
    });

    return seasonsList;
  } catch (error) {
    console.error('Error fetching anime seasons:', error);
    return [];
  }
}

// Отримати аніме за ID
export async function getAnimeById(id: number): Promise<Anime> {
  await jikanLimiter.throttle();

  const response = await fetchWithRetry(`${JIKAN_BASE_URL}/anime/${id}/full`);

  if (!response.ok) {
    throw new Error(`Jikan API error: ${response.status}`);
  }

  const result: JikanSingleResponse<JikanAnime> = await response.json();
  const anime = convertJikanToAnime(result.data);
  
  // Додаємо сезони якщо є
  try {
    const seasons = await getAnimeSeasons(id);
    if (seasons && seasons.length > 0) {
      anime.seasons = seasons;
    }
  } catch (error) {
    console.error('Error loading seasons:', error);
  }
  
  return anime;
}

// Пошук аніме
export async function searchAnime(query: string, limit: number = 24): Promise<Anime[]> {
  await jikanLimiter.throttle();

  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
    order_by: 'popularity',
    sort: 'asc'
  });

  const response = await fetchWithRetry(`${JIKAN_BASE_URL}/anime?${params}`);

  if (!response.ok) {
    throw new Error(`Jikan API error: ${response.status}`);
  }

  const result: JikanPaginatedResponse<JikanAnime> = await response.json();
  return result.data.map(convertJikanToAnime);
}

// Топ аніме
export async function getTopAnime(page: number = 1, limit: number = 24): Promise<Anime[]> {
  await jikanLimiter.throttle();

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  const response = await fetchWithRetry(`${JIKAN_BASE_URL}/top/anime?${params}`);

  if (!response.ok) {
    throw new Error(`Jikan API error: ${response.status}`);
  }

  const result: JikanPaginatedResponse<JikanAnime> = await response.json();
  return result.data.map(convertJikanToAnime);
}

// Поточний сезон
export async function getSeasonalAnime(): Promise<Anime[]> {
  await jikanLimiter.throttle();

  const response = await fetchWithRetry(`${JIKAN_BASE_URL}/seasons/now?limit=24`);

  if (!response.ok) {
    throw new Error(`Jikan API error: ${response.status}`);
  }

  const result: JikanPaginatedResponse<JikanAnime> = await response.json();
  return result.data.map(convertJikanToAnime);
}

// Отримати всі сезони та пов'язані аніме (Sequel, Prequel, Alternative version, etc.)
export async function getRelations(id: number): Promise<Anime[]> {
  await jikanLimiter.throttle();

  try {
    const response = await fetchWithRetry(`${JIKAN_BASE_URL}/anime/${id}/relations`);

    if (!response.ok) {
      console.error('[API] Jikan relations failed:', response.status);
      return [];
    }

    const result = await response.json();

    // Збираємо всі пов'язані аніме
    const relatedAnime: Anime[] = [];

    if (result.data && Array.isArray(result.data)) {
      for (const relation of result.data) {
        // Фільтруємо тільки аніме (не мангу)
        if (relation.entry && Array.isArray(relation.entry)) {
          for (const entry of relation.entry) {
            if (entry.type === 'anime') {
              relatedAnime.push({
                id: entry.mal_id,
                malId: entry.mal_id,
                title: entry.name,
                titleEnglish: entry.name,
                poster: 'https://cdn.myanimelist.net/img/sp/icon/apple-touch-icon-256.png',
                genres: [],
                studios: [],
                status: 'completed',
                type: 'tv',
                source: 'jikan',
                url: entry.url,
                // Додаємо тип зв'язку (Sequel, Prequel, etc.)
                relation: relation.relation,
              } as Anime & { relation: string });
            }
          }
        }
      }
    }

    return relatedAnime;
  } catch (error) {
    console.error('[API] Jikan relations failed:', error);
    return [];
  }
}

// Рекомендації
export async function getRecommendations(id: number): Promise<Anime[]> {
  await jikanLimiter.throttle();

  const response = await fetchWithRetry(`${JIKAN_BASE_URL}/anime/${id}/recommendations`);

  if (!response.ok) {
    throw new Error(`Jikan API error: ${response.status}`);
  }

  const result: JikanSingleResponse<JikanRecommendation[]> = await response.json();

  // Конвертуємо рекомендації в спрощений формат Anime
  return result.data.slice(0, 12).map(rec => ({
    id: rec.entry.mal_id,
    malId: rec.entry.mal_id,
    title: rec.entry.title,
    poster: rec.entry.images.webp.large_image_url || rec.entry.images.jpg.large_image_url,
    status: 'completed' as const,
    type: 'tv' as const,
    genres: [],
    studios: [],
    source: 'jikan' as const,
    url: rec.entry.url
  }));
}

// Аніме за жанром
export async function getAnimeByGenre(genreId: number, limit: number = 24): Promise<Anime[]> {
  await jikanLimiter.throttle();

  const params = new URLSearchParams({
    genres: genreId.toString(),
    limit: limit.toString(),
    order_by: 'popularity'
  });

  const response = await fetchWithRetry(`${JIKAN_BASE_URL}/anime?${params}`);

  if (!response.ok) {
    throw new Error(`Jikan API error: ${response.status}`);
  }

  const result: JikanPaginatedResponse<JikanAnime> = await response.json();
  return result.data.map(convertJikanToAnime);
}

// Schedule item with broadcast info
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

// Day name mapping
const DAY_MAP: Record<string, number> = {
  'mondays': 1,
  'tuesdays': 2,
  'wednesdays': 3,
  'thursdays': 4,
  'fridays': 5,
  'saturdays': 6,
  'sundays': 0,
};

// Get popular ongoing anime schedule (via our API route to avoid CORS)
export async function getPopularSchedule(): Promise<JikanScheduleItem[]> {
  try {
    // Use our API route as proxy
    const response = await fetch('/api/schedule');

    if (!response.ok) {
      console.error('[Jikan] Schedule API error:', response.status);
      return [];
    }

    const result = await response.json();

    console.log('[Jikan] Anime fetched:', result.items?.length || 0);

    return result.items || [];
  } catch (error) {
    console.error('[Jikan] getPopularSchedule error:', error);
    return [];
  }
}
