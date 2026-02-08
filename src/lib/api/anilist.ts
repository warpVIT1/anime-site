// AniList API клієнт (GraphQL)

import type { Anime } from '@/types/anime';
import type { AniListAnime, AniListResponse } from '@/types/api/anilist';
import { anilistLimiter, fetchWithRetry, normalizeScore, normalizeStatus, normalizeType, normalizeSeason, stripHtmlTags } from '@/lib/utils';

const ANILIST_BASE_URL = 'https://graphql.anilist.co';

// Конвертувати AniList дані в універсальний формат
function convertAniListToAnime(data: AniListAnime): Anime {
  const statusMap: Record<string, 'ongoing' | 'completed' | 'announced'> = {
    'FINISHED': 'completed',
    'RELEASING': 'ongoing',
    'NOT_YET_RELEASED': 'announced',
    'CANCELLED': 'completed'
  };

  const id = data.idMal || data.id;
  return {
    id: id,
    slug: id.toString(),
    malId: data.idMal,
    anilistId: data.id,

    title: data.title.romaji,
    titleOriginal: data.title.native,
    titleEnglish: data.title.english,

    poster: data.coverImage.extraLarge || data.coverImage.large,
    posterLarge: data.coverImage.large,
    banner: data.bannerImage,

    description: stripHtmlTags(data.description),
    synopsis: stripHtmlTags(data.description),

    year: data.seasonYear,
    season: normalizeSeason(data.season),
    status: statusMap[data.status || 'RELEASING'] || 'ongoing',
    type: normalizeType(data.format),

    episodes: data.episodes,
    duration: data.duration,

    score: normalizeScore(data.averageScore, 100),
    popularity: data.popularity,

    genres: data.genres || [],
    studios: data.studios?.nodes.map(s => s.name) || [],

    trailer: data.trailer?.id ? {
      id: data.trailer.id,
      site: data.trailer.site?.toLowerCase()
    } : undefined,

    source: 'anilist'
  };
}

// GraphQL запит
async function anilistQuery(query: string, variables: Record<string, unknown>): Promise<unknown> {
  await anilistLimiter.throttle();

  const response = await fetchWithRetry(ANILIST_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`AniList API error: ${response.status}`);
  }

  return response.json();
}

// Отримати аніме за ID
export async function getAnimeById(id: number): Promise<Anime> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        idMal
        title {
          romaji
          english
          native
        }
        description
        coverImage {
          large
          extraLarge
        }
        bannerImage
        episodes
        duration
        status
        season
        seasonYear
        format
        averageScore
        popularity
        genres
        studios {
          nodes {
            id
            name
          }
        }
        trailer {
          id
          site
        }
      }
    }
  `;

  const result = await anilistQuery(query, { id }) as AniListResponse<AniListAnime>;

  if (!result.data.Media) {
    throw new Error('Anime not found');
  }

  return convertAniListToAnime(result.data.Media);
}

// Пошук аніме
export async function searchAnime(query: string, limit: number = 24): Promise<Anime[]> {
  const graphqlQuery = `
    query ($search: String, $perPage: Int) {
      Page(perPage: $perPage) {
        media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
          id
          idMal
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            extraLarge
          }
          episodes
          status
          season
          seasonYear
          format
          averageScore
          genres
        }
      }
    }
  `;

  const result = await anilistQuery(graphqlQuery, { search: query, perPage: limit }) as AniListResponse<AniListAnime>;

  if (!result.data.Page?.media) {
    return [];
  }

  return result.data.Page.media.map(convertAniListToAnime);
}

// Топ аніме
export async function getTopAnime(limit: number = 24): Promise<Anime[]> {
  const query = `
    query ($perPage: Int) {
      Page(perPage: $perPage) {
        media(type: ANIME, sort: SCORE_DESC) {
          id
          idMal
          title {
            romaji
            english
            native
          }
          description
          coverImage {
            large
            extraLarge
          }
          bannerImage
          episodes
          status
          seasonYear
          format
          averageScore
          popularity
          genres
        }
      }
    }
  `;

  const result = await anilistQuery(query, { perPage: limit }) as AniListResponse<AniListAnime>;

  if (!result.data.Page?.media) {
    return [];
  }

  return result.data.Page.media.map(convertAniListToAnime);
}

// Поточний сезон
export async function getSeasonalAnime(): Promise<Anime[]> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  let season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
  if (month >= 1 && month <= 3) season = 'WINTER';
  else if (month >= 4 && month <= 6) season = 'SPRING';
  else if (month >= 7 && month <= 9) season = 'SUMMER';
  else season = 'FALL';

  const query = `
    query ($season: MediaSeason, $seasonYear: Int, $perPage: Int) {
      Page(perPage: $perPage) {
        media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: POPULARITY_DESC) {
          id
          idMal
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            extraLarge
          }
          episodes
          status
          format
          averageScore
          genres
        }
      }
    }
  `;

  const result = await anilistQuery(query, { season, seasonYear: year, perPage: 24 }) as AniListResponse<AniListAnime>;

  if (!result.data.Page?.media) {
    return [];
  }

  return result.data.Page.media.map(convertAniListToAnime);
}
