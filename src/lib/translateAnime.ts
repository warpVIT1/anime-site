// English translation utility for anime titles and genres

import type { Anime } from '@/types/anime';

/**
 * Get English title for anime
 */
export function getEnglishTitle(anime: {
  title: string;
  titleEnglish?: string;
  titleOriginal?: string;
}): string {
  // Priority 1: English title from API
  if (anime.titleEnglish && anime.titleEnglish.trim()) {
    return anime.titleEnglish;
  }

  // Priority 2: Main title (usually English from APIs)
  if (anime.title && anime.title.trim()) {
    return anime.title;
  }

  // Fallback
  return anime.titleOriginal || 'Unknown';
}

/**
 * Translate genre name to English (if any are in Japanese)
 */
export function translateGenreName(genre: string): string {
  const genreMap: Record<string, string> = {
    // Japanese to English
    'アクション': 'Action',
    'アドベンチャー': 'Adventure',
    'コメディ': 'Comedy',
    'ドラマ': 'Drama',
    'ファンタジー': 'Fantasy',
    'ホラー': 'Horror',
    'ミステリー': 'Mystery',
    'ロマンス': 'Romance',
    'SF': 'Sci-Fi',
    'スポーツ': 'Sports',
    '日常': 'Slice of Life',
    '異世界': 'Isekai',
    '超自然': 'Supernatural',
  };

  return genreMap[genre] || genre;
}

/**
 * Process anime to ensure English titles
 */
export function processAnime(anime: Anime): Anime {
  const englishTitle = getEnglishTitle(anime);

  return {
    ...anime,
    title: englishTitle,
    titleEnglish: englishTitle,
    genres: anime.genres?.map(translateGenreName) || [],
  };
}

/**
 * Process multiple anime
 */
export function processAnimeList(animeList: Anime[]): Anime[] {
  return animeList.map(processAnime);
}

/**
 * Smart translate - clean up title
 */
export function smartTranslate(title: string): string {
  if (!title) return '';
  return title.trim();
}

export default {
  getEnglishTitle,
  translateGenreName,
  processAnime,
  processAnimeList,
  smartTranslate,
};
