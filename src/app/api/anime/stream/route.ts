import { NextRequest, NextResponse } from 'next/server';

// HiAnime/Zoro API endpoints (self-hosted instances)
const HIANIME_API_ENDPOINTS = [
  'https://hianime-api.vercel.app',
  'https://aniwatch-api-dusky.vercel.app',
  'https://api-aniwatch.onrender.com',
];

interface StreamingSource {
  url: string;
  quality: string;
  isM3U8: boolean;
}

interface StreamingResponse {
  success: boolean;
  sources: StreamingSource[];
  subtitles: { url: string; lang: string }[];
  error?: string;
}

// Search for anime on HiAnime by title
async function searchAnime(title: string, apiBase: string): Promise<string | null> {
  try {
    const response = await fetch(`${apiBase}/api/v2/hianime/search?q=${encodeURIComponent(title)}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.success && data.data?.animes?.length > 0) {
      return data.data.animes[0].id;
    }
  } catch (error) {
    console.error('Search error:', error);
  }
  return null;
}

// Get episodes for anime
async function getEpisodes(animeId: string, apiBase: string): Promise<{ episodeId: string; number: number }[]> {
  try {
    const response = await fetch(`${apiBase}/api/v2/hianime/anime/${animeId}/episodes`);
    if (!response.ok) return [];
    
    const data = await response.json();
    if (data.success && data.data?.episodes?.length > 0) {
      return data.data.episodes.map((ep: { episodeId: string; number: number }) => ({
        episodeId: ep.episodeId,
        number: ep.number,
      }));
    }
  } catch (error) {
    console.error('Episodes error:', error);
  }
  return [];
}

// Get streaming sources for episode
async function getStreamingSources(
  episodeId: string, 
  apiBase: string,
  server: string = 'hd-1'
): Promise<StreamingResponse> {
  try {
    const response = await fetch(
      `${apiBase}/api/v2/hianime/episode/sources?animeEpisodeId=${episodeId}&server=${server}&category=sub`
    );
    if (!response.ok) {
      return { success: false, sources: [], subtitles: [], error: 'Failed to fetch sources' };
    }
    
    const data = await response.json();
    if (data.success && data.data?.sources?.length > 0) {
      return {
        success: true,
        sources: data.data.sources.map((s: { url: string; quality?: string; type?: string }) => ({
          url: s.url,
          quality: s.quality || 'auto',
          isM3U8: s.type === 'hls' || s.url.includes('.m3u8'),
        })),
        subtitles: data.data.tracks?.filter((t: { kind: string }) => t.kind === 'captions') || [],
      };
    }
  } catch (error) {
    console.error('Streaming sources error:', error);
  }
  return { success: false, sources: [], subtitles: [], error: 'No sources found' };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const title = searchParams.get('title');
  const episode = parseInt(searchParams.get('episode') || '1', 10);
  const anilistId = searchParams.get('anilistId');
  
  if (!title && !anilistId) {
    return NextResponse.json(
      { success: false, error: 'Title or anilistId is required' },
      { status: 400 }
    );
  }

  // Try each API endpoint
  for (const apiBase of HIANIME_API_ENDPOINTS) {
    try {
      // Search for anime
      const searchQuery = title || `anilist:${anilistId}`;
      const animeId = await searchAnime(searchQuery, apiBase);
      
      if (!animeId) continue;

      // Get episodes
      const episodes = await getEpisodes(animeId, apiBase);
      if (episodes.length === 0) continue;

      // Find the episode we need
      const targetEpisode = episodes.find(ep => ep.number === episode);
      if (!targetEpisode) {
        return NextResponse.json({
          success: false,
          error: `Episode ${episode} not found. Available: 1-${episodes.length}`,
        });
      }

      // Get streaming sources
      const sources = await getStreamingSources(targetEpisode.episodeId, apiBase);
      if (sources.success) {
        return NextResponse.json(sources);
      }
    } catch (error) {
      console.error(`Error with ${apiBase}:`, error);
      continue;
    }
  }

  return NextResponse.json(
    { success: false, error: 'Could not find streaming sources' },
    { status: 404 }
  );
}
