import type { Anime } from '@/types/anime';
import type { AniListAnime, AniListResponse } from '@/types/api/anilist';
import { anilistLimiter, fetchWithRetry, normalizeScore, normalizeType, normalizeSeason, stripHtmlTags } from '@/lib/utils';

const BASE_URL = 'https://graphql.anilist.co';

const STATUS_MAP: Record<string, 'ongoing' | 'completed' | 'announced'> = {
  'FINISHED': 'completed',
  'RELEASING': 'ongoing',
  'NOT_YET_RELEASED': 'announced',
  'CANCELLED': 'completed'
};

function toAnime(data: AniListAnime): Anime {
  const id = data.idMal || data.id;
  return {
    id,
    slug: String(id),
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
    status: STATUS_MAP[data.status || 'RELEASING'] || 'ongoing',
    type: normalizeType(data.format),
    episodes: data.episodes,
    duration: data.duration,
    score: normalizeScore(data.averageScore, 100),
    popularity: data.popularity,
    genres: data.genres || [],
    studios: data.studios?.nodes.map(s => s.name) || [],
    trailer: data.trailer?.id ? { id: data.trailer.id, site: data.trailer.site?.toLowerCase() } : undefined,
    source: 'anilist'
  };
}

async function query(gql: string, vars: Record<string, unknown>): Promise<unknown> {
  await anilistLimiter.throttle();

  const res = await fetchWithRetry(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ query: gql, variables: vars })
  });

  if (!res.ok) throw new Error(`AniList error: ${res.status}`);
  return res.json();
}

const ANIME_FIELDS = `
  id idMal
  title { romaji english native }
  description
  coverImage { large extraLarge }
  bannerImage
  episodes duration status season seasonYear format
  averageScore popularity genres
  studios { nodes { id name } }
  trailer { id site }
`;

export async function getAnimeById(id: number): Promise<Anime> {
  const gql = `query ($id: Int) { Media(id: $id, type: ANIME) { ${ANIME_FIELDS} } }`;
  const result = await query(gql, { id }) as AniListResponse<AniListAnime>;

  if (!result.data.Media) throw new Error('Anime not found');
  return toAnime(result.data.Media);
}

export async function searchAnime(search: string, limit = 24): Promise<Anime[]> {
  const gql = `
    query ($search: String, $perPage: Int) {
      Page(perPage: $perPage) {
        media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
          id idMal title { romaji english native }
          coverImage { large extraLarge }
          episodes status season seasonYear format averageScore genres
        }
      }
    }
  `;
  const result = await query(gql, { search, perPage: limit }) as AniListResponse<AniListAnime>;
  return result.data.Page?.media?.map(toAnime) || [];
}

export async function getTopAnime(limit = 24): Promise<Anime[]> {
  const gql = `
    query ($perPage: Int) {
      Page(perPage: $perPage) {
        media(type: ANIME, sort: SCORE_DESC) {
          id idMal title { romaji english native } description
          coverImage { large extraLarge } bannerImage
          episodes status seasonYear format averageScore popularity genres
        }
      }
    }
  `;
  const result = await query(gql, { perPage: limit }) as AniListResponse<AniListAnime>;
  return result.data.Page?.media?.map(toAnime) || [];
}

export async function getSeasonalAnime(): Promise<Anime[]> {
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const season = month <= 3 ? 'WINTER' : month <= 6 ? 'SPRING' : month <= 9 ? 'SUMMER' : 'FALL';

  const gql = `
    query ($season: MediaSeason, $seasonYear: Int, $perPage: Int) {
      Page(perPage: $perPage) {
        media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: POPULARITY_DESC) {
          id idMal title { romaji english native }
          coverImage { large extraLarge }
          episodes status format averageScore genres
        }
      }
    }
  `;
  const result = await query(gql, { season, seasonYear: year, perPage: 24 }) as AniListResponse<AniListAnime>;
  return result.data.Page?.media?.map(toAnime) || [];
}
