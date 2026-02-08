export interface Anime {
  // IDs from different sources
  id: number | string;
  slug?: string;
  malId?: number;
  anilistId?: number;
  kitsuId?: string;

  // titles
  title: string;
  titleOriginal?: string;
  titleEnglish?: string;
  titleUkrainian?: string;

  // images
  poster: string;
  posterLarge?: string;
  banner?: string;

  // descriptions
  description?: string;
  synopsis?: string;
  background?: string;

  // basic info
  year?: number;
  season?: 'winter' | 'spring' | 'summer' | 'fall';
  status: 'ongoing' | 'completed' | 'announced';
  type: 'tv' | 'movie' | 'ova' | 'ona' | 'special' | 'music';

  // episodes
  episodes?: number;
  episodesAired?: number;
  duration?: number;

  // ratings
  score?: number;
  scoredBy?: number;
  rank?: number;
  popularity?: number;

  // categories
  genres: string[];
  studios: string[];
  demographics?: string[];
  themes?: string[];

  trailer?: {
    id?: string;
    url?: string;
    embedUrl?: string;
    site?: string;
  };

  rating?: string;
  sourceType?: string;

  nextAiringEpisode?: {
    episode: number;
    airingAt: number;
  } | null;

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
