// Типи для Jikan API (MyAnimeList)

export interface JikanAnime {
  mal_id: number;
  url: string;
  images: {
    jpg: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
    webp: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
  };
  trailer?: {
    youtube_id?: string;
    url?: string;
    embed_url?: string;
  };
  title: string;
  title_english?: string;
  title_japanese?: string;
  type?: string;
  source?: string;
  episodes?: number;
  status?: string;
  airing: boolean;
  aired: {
    from?: string;
    to?: string;
    string?: string;
  };
  duration?: string;
  rating?: string;
  score?: number;
  scored_by?: number;
  rank?: number;
  popularity?: number;
  synopsis?: string;
  background?: string;
  season?: string;
  year?: number;
  genres: JikanGenre[];
  studios: JikanStudio[];
  demographics?: JikanDemographic[];
  themes?: JikanTheme[];
}

export interface JikanGenre {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface JikanStudio {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface JikanDemographic {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface JikanTheme {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface JikanPaginatedResponse<T> {
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
    items: {
      count: number;
      total: number;
      per_page: number;
    };
  };
  data: T[];
}

export interface JikanSingleResponse<T> {
  data: T;
}

export interface JikanRecommendation {
  entry: {
    mal_id: number;
    url: string;
    images: JikanAnime['images'];
    title: string;
  };
  votes: number;
}
