import type { Anime } from '@/types/anime';
import * as jikan from './jikan';
import * as anilist from './anilist';
import * as kitsu from './kitsu';
import * as consumet from './consumet';
import { processAnime } from '../translateAnime';

function process(anime: Anime): Anime {
  return processAnime(anime);
}

function processList(list: Anime[]): Anime[] {
  return list.map(processAnime);
}

export async function getAnimeById(id: number): Promise<Anime> {
  // jikan first - most complete
  try {
    return process(await jikan.getAnimeById(id));
  } catch {}

  try {
    return process(await anilist.getAnimeById(id));
  } catch {}

  try {
    return process(await kitsu.getAnimeById(id));
  } catch {
    throw new Error(`Failed to fetch anime ${id}`);
  }
}

export async function searchAnime(query: string, limit = 24): Promise<Anime[]> {
  try {
    const res = await consumet.searchAnime(query, 1, limit);
    if (res.length) return processList(res);
  } catch {}

  try {
    const res = await jikan.searchAnime(query, limit);
    if (res.length) return processList(res);
  } catch {}

  try {
    const res = await anilist.searchAnime(query, limit);
    if (res.length) return processList(res);
  } catch {}

  try {
    return processList(await kitsu.searchAnime(query, limit));
  } catch {
    return [];
  }
}

export async function getTopAnime(page = 1, limit = 24): Promise<Anime[]> {
  try {
    const res = await consumet.getPopularAnime(page, limit);
    if (res.length) return processList(res);
  } catch {}

  try {
    const res = await anilist.getTopAnime(limit);
    if (res.length) return processList(res);
  } catch {}

  try {
    const res = await jikan.getTopAnime(page, limit);
    if (res.length) return processList(res);
  } catch {}

  try {
    return processList(await kitsu.getTopAnime(limit));
  } catch {
    return [];
  }
}

export async function getSeasonalAnime(): Promise<Anime[]> {
  try {
    return processList(await jikan.getSeasonalAnime());
  } catch {}

  try {
    return processList(await anilist.getSeasonalAnime());
  } catch {
    return [];
  }
}

export async function getTrendingAnime(page = 1, limit = 24): Promise<Anime[]> {
  try {
    const res = await consumet.getTrendingAnime(page, limit);
    if (res.length) return processList(res);
  } catch {}

  try {
    return processList(await kitsu.getTrendingAnime());
  } catch {
    return getTopAnime(1, limit);
  }
}

export async function getRecommendations(id: number): Promise<Anime[]> {
  try {
    return processList(await jikan.getRecommendations(id));
  } catch {
    return [];
  }
}

export async function getRelatedAnime(id: number) {
  try {
    return await jikan.getAnimeRelations(id);
  } catch {
    return [];
  }
}

export async function getAnimeByGenre(genreId: number, limit = 24): Promise<Anime[]> {
  try {
    return processList(await jikan.getAnimeByGenre(genreId, limit));
  } catch {
    return [];
  }
}

export async function getRandomAnime(count = 1): Promise<Anime[]> {
  try {
    const top = await getTopAnime(1, 100);
    return top.sort(() => 0.5 - Math.random()).slice(0, count);
  } catch {
    return [];
  }
}

export async function getRecentEpisodes(page = 1, limit = 24): Promise<Anime[]> {
  try {
    return processList(await consumet.getRecentEpisodes(page, limit));
  } catch {
    return getSeasonalAnime();
  }
}

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
    return processList(await consumet.advancedSearch(params));
  } catch {
    if (params.query) return searchAnime(params.query, params.perPage || 24);
    return getTopAnime(params.page || 1, params.perPage || 24);
  }
}

export async function getWeeklySchedule() {
  try {
    return await consumet.getWeeklySchedule();
  } catch {
    return [];
  }
}

export async function getPopularSchedule() {
  try {
    return await jikan.getPopularSchedule();
  } catch {
    return [];
  }
}

export type { ScheduleItem } from './consumet';
export type { JikanScheduleItem } from './jikan';
export { jikan, anilist, kitsu, consumet };
