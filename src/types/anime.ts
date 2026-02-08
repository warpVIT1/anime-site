// Універсальний тип аніме для всіх API

export interface Anime {
  // ID з різних джерел
  id: number | string;     // Може бути число або slug (як у YouTube)
  slug?: string;           // URL-friendly ID
  malId?: number;          // MyAnimeList ID
  anilistId?: number;      // AniList ID
  kitsuId?: string;        // Kitsu ID

  // Назви
  title: string;           // Основна назва
  titleOriginal?: string;  // Японська
  titleEnglish?: string;   // Англійська
  titleUkrainian?: string; // Українська (якщо є)

  // Зображення
  poster: string;
  posterLarge?: string;
  banner?: string;

  // Опис
  description?: string;
  synopsis?: string;
  background?: string;

  // Базова інформація
  year?: number;
  season?: 'winter' | 'spring' | 'summer' | 'fall';
  status: 'ongoing' | 'completed' | 'announced';
  type: 'tv' | 'movie' | 'ova' | 'ona' | 'special' | 'music';

  // Епізоди
  episodes?: number;
  episodesAired?: number;
  duration?: number;        // в хвилинах

  // Рейтинги
  score?: number;           // 0-10 або 0-100
  scoredBy?: number;
  rank?: number;
  popularity?: number;

  // Категорії
  genres: string[];
  studios: string[];
  demographics?: string[];
  themes?: string[];

  // Трейлер
  trailer?: {
    id?: string;
    url?: string;
    embedUrl?: string;
    site?: string;
  };

  // Додаткова інформація
  rating?: string;          // Віковий рейтинг (G, PG, PG-13, R, R+, Rx)
  sourceType?: string;      // Джерело (Manga, Light novel, Visual novel, etc)
  
  // Наступний епізод (для онгоінгів)
  nextAiringEpisode?: {
    episode: number;
    airingAt: number;       // Unix timestamp
  } | null;

  // Сезони
  seasons?: Array<{
    id: number;
    number: number;
    title?: string;
    year?: number;
    episodes?: number;
    score?: number;
    status?: string;
    malId?: number;
  }>;

  // Метадані
  source: 'jikan' | 'anilist' | 'kitsu';
  url?: string;
  aired?: {
    from?: string;
    to?: string;
  };
}

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  bgCard: string;
  text: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  gradient: string;
  border: string;
}
