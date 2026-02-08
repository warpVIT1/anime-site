// AniList GraphQL API types

export interface AniListAnime {
  id: number;
  idMal?: number;
  title: {
    romaji: string;
    english?: string;
    native?: string;
  };
  description?: string;
  coverImage: {
    large: string;
    medium: string;
    extraLarge?: string;
  };
  bannerImage?: string;
  episodes?: number;
  duration?: number;
  status?: 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED';
  season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
  seasonYear?: number;
  format?: 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC';
  averageScore?: number;
  popularity?: number;
  genres?: string[];
  studios?: {
    nodes: {
      id: number;
      name: string;
    }[];
  };
  trailer?: {
    id?: string;
    site?: string;
    thumbnail?: string;
  };
  relations?: {
    edges: {
      relationType: string;
      node: {
        id: number;
        title: {
          romaji: string;
        };
        coverImage: {
          medium: string;
        };
      };
    }[];
  };
  recommendations?: {
    nodes: {
      mediaRecommendation: {
        id: number;
        title: {
          romaji: string;
        };
        coverImage: {
          medium: string;
        };
      };
    }[];
  };
}

export interface AniListResponse<T> {
  data: {
    Media?: T;
    Page?: {
      media: T[];
      pageInfo: {
        total: number;
        currentPage: number;
        lastPage: number;
        hasNextPage: boolean;
        perPage: number;
      };
    };
  };
}

export interface AniListSearchResponse {
  data: {
    Page: {
      media: AniListAnime[];
      pageInfo: {
        total: number;
        currentPage: number;
        lastPage: number;
        hasNextPage: boolean;
        perPage: number;
      };
    };
  };
}
