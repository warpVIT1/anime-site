// Типи для Kitsu API

export interface KitsuAnime {
  id: string;
  type: 'anime';
  attributes: {
    slug: string;
    synopsis?: string;
    description?: string;
    titles: {
      en?: string;
      en_jp?: string;
      ja_jp?: string;
    };
    canonicalTitle: string;
    abbreviatedTitles?: string[];
    averageRating?: string;
    userCount?: number;
    favoritesCount?: number;
    popularityRank?: number;
    ratingRank?: number;
    startDate?: string;
    endDate?: string;
    status?: 'current' | 'finished' | 'tba' | 'unreleased' | 'upcoming';
    posterImage?: {
      tiny?: string;
      small?: string;
      medium?: string;
      large?: string;
      original?: string;
    };
    coverImage?: {
      tiny?: string;
      small?: string;
      large?: string;
      original?: string;
    };
    episodeCount?: number;
    episodeLength?: number;
    youtubeVideoId?: string;
    showType?: 'TV' | 'movie' | 'OVA' | 'ONA' | 'special' | 'music';
    nsfw?: boolean;
  };
  relationships?: {
    genres?: {
      data: Array<{
        id: string;
        type: 'genres';
      }>;
    };
    categories?: {
      data: Array<{
        id: string;
        type: 'categories';
      }>;
    };
    animeProductions?: {
      data: Array<{
        id: string;
        type: 'animeProductions';
      }>;
    };
  };
}

export interface KitsuResponse<T> {
  data: T;
  included?: Array<{
    id: string;
    type: string;
    attributes: Record<string, unknown>;
  }>;
}

export interface KitsuListResponse<T> {
  data: T[];
  meta?: {
    count: number;
  };
  links?: {
    first?: string;
    next?: string;
    last?: string;
  };
  included?: Array<{
    id: string;
    type: string;
    attributes: Record<string, unknown>;
  }>;
}

export interface KitsuGenre {
  id: string;
  type: 'genres';
  attributes: {
    name: string;
    slug: string;
  };
}
