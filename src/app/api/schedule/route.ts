import { NextResponse } from 'next/server';

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

interface JikanAnime {
  mal_id: number;
  title: string;
  title_english?: string;
  broadcast?: {
    day?: string;
    time?: string;
  };
  images?: {
    jpg?: {
      large_image_url?: string;
    };
  };
  score?: number;
  status?: string;
  episodes?: number;
  genres?: Array<{ name: string }>;
  members?: number;
}

interface JikanScheduleItem {
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

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AnimeApp/1.0',
        },
      });

      if (response.ok) {
        return response;
      }

      // Rate limit - wait before retrying
      if (response.status === 429 && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }

      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  throw new Error('Max retries exceeded');
}

export async function GET() {
  try {
    // Fetch currently airing anime with broadcast schedule info
    const response = await fetchWithRetry(
      `${JIKAN_BASE_URL}/anime?status=airing&order_by=members&sort=desc&limit=100`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch from Jikan API' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const items: JikanScheduleItem[] = [];

    if (data.data && Array.isArray(data.data)) {
      for (const anime of data.data) {
        const jikanAnime = anime as JikanAnime;
        
        // Only include anime with broadcast schedule info
        if (jikanAnime.broadcast?.day) {
          const item: JikanScheduleItem = {
            id: jikanAnime.mal_id,
            malId: jikanAnime.mal_id,
            title: jikanAnime.title,
            titleEnglish: jikanAnime.title_english || jikanAnime.title,
            poster: jikanAnime.images?.jpg?.large_image_url || '',
            score: jikanAnime.score || 0,
            members: jikanAnime.members || 0,
            episodes: jikanAnime.episodes || 0,
            broadcastDay: jikanAnime.broadcast.day,
            broadcastTime: jikanAnime.broadcast.time || '00:00',
            status: jikanAnime.status || '',
            genres: jikanAnime.genres?.map(g => g.name) || [],
          };

          items.push(item);
        }
      }
    }

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('Schedule API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule', items: [] },
      { status: 500 }
    );
  }
}
