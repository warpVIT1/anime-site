import { NextRequest, NextResponse } from 'next/server';

// Multiple API sources to try
const API_SOURCES = {
  // Anify API - aggregator
  anify: 'https://api.anify.tv',
  // AnimePahe scraper
  amvstr: 'https://api.amvstr.me',
  // Backup
  aniwatch: 'https://aniwatch-api.vercel.app',
};

interface Source {
  url: string;
  quality: string;
  isM3U8: boolean;
}

interface ApiResponse {
  success: boolean;
  sources: Source[];
  subtitles: { url: string; lang: string }[];
  referer?: string;
  error?: string;
}

// Try to fetch with timeout
async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      cache: 'no-store',
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Clean title for better search results
function cleanTitle(title: string): string {
  return title
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/Season \d+/gi, '')
    .replace(/Part \d+/gi, '')
    .replace(/[:\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Generate search variations
function getSearchVariations(title: string): string[] {
  const variations: string[] = [title];
  const cleaned = cleanTitle(title);
  if (cleaned !== title) variations.push(cleaned);
  
  // Common title transformations for Gogoanime format
  const transforms: [RegExp, string][] = [
    [/Attack on Titan/i, 'shingeki-no-kyojin'],
    [/My Hero Academia/i, 'boku-no-hero-academia'],
    [/Demon Slayer/i, 'kimetsu-no-yaiba'],
    [/Spy x Family/i, 'spy-x-family'],
    [/One Punch Man/i, 'one-punch-man'],
    [/Jujutsu Kaisen/i, 'jujutsu-kaisen-tv'],
    [/Chainsaw Man/i, 'chainsaw-man'],
    [/Tokyo Ghoul/i, 'tokyo-ghoul'],
    [/Death Note/i, 'death-note'],
    [/Fullmetal Alchemist/i, 'fullmetal-alchemist-brotherhood'],
    [/Naruto Shippuden/i, 'naruto-shippuuden'],
    [/Hunter x Hunter/i, 'hunter-x-hunter-2011'],
    [/One Piece/i, 'one-piece'],
    [/Bleach/i, 'bleach'],
    [/Dragon Ball/i, 'dragon-ball'],
    [/Sword Art Online/i, 'sword-art-online'],
    [/Steins Gate/i, 'steinsgate'],
  ];
  
  for (const [pattern, replacement] of transforms) {
    if (pattern.test(title)) {
      variations.push(replacement);
    }
  }
  
  return [...new Set(variations)];
}

// Try Anify API
async function tryAnifyAPI(title: string, episode: number): Promise<ApiResponse> {
  try {
    console.log('Trying Anify API...');
    
    // Search
    const searchUrl = `${API_SOURCES.anify}/search/anime/${encodeURIComponent(title)}`;
    console.log('Anify search:', searchUrl);
    const searchRes = await fetchWithTimeout(searchUrl);
    
    if (!searchRes.ok) {
      console.log('Anify search failed:', searchRes.status);
      return { success: false, sources: [], subtitles: [] };
    }
    
    const searchData = await searchRes.json();
    if (!searchData.results || searchData.results.length === 0) {
      return { success: false, sources: [], subtitles: [] };
    }
    
    const animeId = searchData.results[0].id;
    console.log('Anify found:', animeId);
    
    // Get episodes
    const infoUrl = `${API_SOURCES.anify}/info/${animeId}`;
    const infoRes = await fetchWithTimeout(infoUrl);
    
    if (!infoRes.ok) {
      return { success: false, sources: [], subtitles: [] };
    }
    
    const infoData = await infoRes.json();
    
    // Find episode and get sources
    if (infoData.episodes && infoData.episodes.data) {
      for (const provider of Object.keys(infoData.episodes.data)) {
        const episodes = infoData.episodes.data[provider];
        const ep = episodes.find((e: { number: number }) => e.number === episode);
        
        if (ep) {
          const sourcesUrl = `${API_SOURCES.anify}/sources?providerId=${provider}&watchId=${encodeURIComponent(ep.id)}&episodeNumber=${episode}&id=${animeId}`;
          console.log('Anify sources:', sourcesUrl);
          const sourcesRes = await fetchWithTimeout(sourcesUrl);
          
          if (sourcesRes.ok) {
            const sourcesData = await sourcesRes.json();
            if (sourcesData.sources && sourcesData.sources.length > 0) {
              return {
                success: true,
                sources: sourcesData.sources.map((s: { url: string; quality: string }) => ({
                  url: s.url,
                  quality: s.quality || 'auto',
                  isM3U8: s.url.includes('.m3u8'),
                })),
                subtitles: sourcesData.subtitles || [],
              };
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Anify error:', error);
  }
  return { success: false, sources: [], subtitles: [] };
}

// Try Amvstr API (AnimePahe based)
async function tryAmvstrAPI(title: string, episode: number): Promise<ApiResponse> {
  try {
    console.log('Trying Amvstr API...');
    const variations = getSearchVariations(title);
    
    for (const query of variations) {
      try {
        const searchUrl = `${API_SOURCES.amvstr}/api/v2/search?q=${encodeURIComponent(query)}`;
        console.log('Amvstr search:', searchUrl);
        const searchRes = await fetchWithTimeout(searchUrl);
        
        if (!searchRes.ok) continue;
        
        const searchData = await searchRes.json();
        if (!searchData.results || searchData.results.length === 0) continue;
        
        const animeId = searchData.results[0].id;
        console.log('Amvstr found:', animeId);
        
        // Get stream
        const streamUrl = `${API_SOURCES.amvstr}/api/v2/stream/${animeId}/${episode}`;
        console.log('Amvstr stream:', streamUrl);
        const streamRes = await fetchWithTimeout(streamUrl);
        
        if (!streamRes.ok) continue;
        
        const streamData = await streamRes.json();
        if (streamData.stream && streamData.stream.multi) {
          const sources: Source[] = [];
          
          for (const quality of Object.keys(streamData.stream.multi)) {
            const url = streamData.stream.multi[quality].url;
            if (url) {
              sources.push({
                url,
                quality,
                isM3U8: url.includes('.m3u8'),
              });
            }
          }
          
          if (sources.length > 0) {
            return {
              success: true,
              sources,
              subtitles: [],
            };
          }
        }
      } catch (e) {
        console.log('Amvstr query failed:', query);
      }
    }
  } catch (error) {
    console.error('Amvstr error:', error);
  }
  return { success: false, sources: [], subtitles: [] };
}

// Try direct Gogoanime scraping via proxy
async function tryGogoDirectScrape(title: string, episode: number): Promise<ApiResponse> {
  try {
    console.log('Trying direct Gogoanime scrape...');
    const variations = getSearchVariations(title);
    
    for (const slug of variations) {
      // Try common Gogoanime episode URL patterns
      const slugClean = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-');
      const patterns = [
        `${slugClean}-episode-${episode}`,
        `${slugClean}-tv-episode-${episode}`,
        `${slugClean}-dub-episode-${episode}`,
      ];
      
      for (const episodeSlug of patterns) {
        try {
          // Try AniAPI which scrapes Gogoanime
          const url = `https://api.consumet.org/anime/gogoanime/watch/${episodeSlug}`;
          console.log('Trying direct:', url);
          const res = await fetchWithTimeout(url, 5000);
          
          if (res.ok) {
            const data = await res.json();
            if (data.sources && data.sources.length > 0) {
              return {
                success: true,
                sources: data.sources.map((s: { url: string; quality: string; isM3U8?: boolean }) => ({
                  url: s.url,
                  quality: s.quality || 'auto',
                  isM3U8: s.isM3U8 ?? s.url.includes('.m3u8'),
                })),
                subtitles: data.subtitles || [],
              };
            }
          }
        } catch (e) {
          // Continue to next pattern
        }
      }
    }
  } catch (error) {
    console.error('Direct scrape error:', error);
  }
  return { success: false, sources: [], subtitles: [] };
}

// Try Aniwatch API
async function tryAniwatchAPI(title: string, episode: number): Promise<ApiResponse> {
  try {
    console.log('Trying Aniwatch API...');
    const variations = getSearchVariations(title);
    
    for (const query of variations) {
      try {
        const searchUrl = `${API_SOURCES.aniwatch}/api/v2/hianime/search?q=${encodeURIComponent(query)}`;
        console.log('Aniwatch search:', searchUrl);
        const searchRes = await fetchWithTimeout(searchUrl);
        
        if (!searchRes.ok) continue;
        
        const searchData = await searchRes.json();
        if (!searchData.data?.animes || searchData.data.animes.length === 0) continue;
        
        // Find the main series (not movie/special)
        let anime = searchData.data.animes.find((a: { type: string }) => 
          a.type === 'TV' || a.type === 'TV Series'
        ) || searchData.data.animes[0];
        
        const animeId = anime.id;
        console.log('Aniwatch found:', animeId, 'Type:', anime.type);
        
        // Get episodes
        const episodesUrl = `${API_SOURCES.aniwatch}/api/v2/hianime/anime/${animeId}/episodes`;
        console.log('Aniwatch episodes:', episodesUrl);
        const episodesRes = await fetchWithTimeout(episodesUrl);
        
        if (!episodesRes.ok) {
          console.log('Aniwatch episodes failed:', episodesRes.status);
          continue;
        }
        
        const episodesData = await episodesRes.json();
        if (!episodesData.data?.episodes || episodesData.data.episodes.length === 0) {
          console.log('No episodes found');
          continue;
        }
        
        console.log('Found', episodesData.data.episodes.length, 'episodes');
        
        // Find the episode by number
        const ep = episodesData.data.episodes.find((e: { number: number }) => e.number === episode);
        if (!ep) {
          console.log('Episode', episode, 'not found');
          continue;
        }
        
        console.log('Found episode:', ep.episodeId);
        
        // Get sources - try different servers
        // The episodeId contains ?ep= which should NOT be URL encoded
        const servers = ['hd-1', 'hd-2', 'megacloud', 'streamsb'];
        
        for (const server of servers) {
          try {
            const sourcesUrl = `${API_SOURCES.aniwatch}/api/v2/hianime/episode/sources?animeEpisodeId=${ep.episodeId}&server=${server}&category=sub`;
            console.log('Aniwatch sources:', sourcesUrl);
            const sourcesRes = await fetchWithTimeout(sourcesUrl, 15000);
            
            if (!sourcesRes.ok) {
              console.log('Aniwatch sources failed:', sourcesRes.status);
              continue;
            }
            
            const sourcesData = await sourcesRes.json();
            console.log('Sources response:', JSON.stringify(sourcesData).slice(0, 300));
            
            if (sourcesData.data?.sources && sourcesData.data.sources.length > 0) {
              console.log('SUCCESS: Found', sourcesData.data.sources.length, 'sources from server', server);
              return {
                success: true,
                sources: sourcesData.data.sources.map((s: { url: string; quality?: string; type?: string }) => ({
                  url: s.url,
                  quality: s.quality || 'auto',
                  isM3U8: s.type === 'hls' || s.url.includes('.m3u8'),
                })),
                subtitles: sourcesData.data.tracks?.filter((t: { kind: string }) => t.kind === 'captions') || [],
              };
            }
          } catch (serverError) {
            console.log('Server', server, 'failed:', serverError);
          }
        }
      } catch (e) {
        console.log('Aniwatch query failed:', query, e);
      }
    }
  } catch (error) {
    console.error('Aniwatch error:', error);
  }
  return { success: false, sources: [], subtitles: [] };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const title = searchParams.get('title');
  const episode = parseInt(searchParams.get('episode') || '1', 10);
  
  if (!title) {
    return NextResponse.json(
      { success: false, error: 'Title is required' },
      { status: 400 }
    );
  }
  
  console.log(`\n=== Searching for: "${title}" Episode ${episode} ===`);
  
  const errors: string[] = [];
  
  // Try Aniwatch first (HiAnime based - usually best quality)
  try {
    const result = await tryAniwatchAPI(title, episode);
    if (result.success && result.sources.length > 0) {
      console.log('SUCCESS: Aniwatch');
      return NextResponse.json(result);
    }
  } catch (e) {
    errors.push('Aniwatch failed');
  }
  
  // Try Anify (aggregator)
  try {
    const result = await tryAnifyAPI(title, episode);
    if (result.success && result.sources.length > 0) {
      console.log('SUCCESS: Anify');
      return NextResponse.json(result);
    }
  } catch (e) {
    errors.push('Anify failed');
  }
  
  // Try Amvstr
  try {
    const result = await tryAmvstrAPI(title, episode);
    if (result.success && result.sources.length > 0) {
      console.log('SUCCESS: Amvstr');
      return NextResponse.json(result);
    }
  } catch (e) {
    errors.push('Amvstr failed');
  }
  
  // Try direct scrape
  try {
    const result = await tryGogoDirectScrape(title, episode);
    if (result.success && result.sources.length > 0) {
      console.log('SUCCESS: Direct Gogoanime');
      return NextResponse.json(result);
    }
  } catch (e) {
    errors.push('Direct scrape failed');
  }
  
  console.log('FAILED: All sources exhausted');
  
  return NextResponse.json({
    success: false,
    sources: [],
    subtitles: [],
    error: 'No streaming sources found. All providers failed.',
  });
}

// Proxy endpoint for HLS segments (to bypass CORS)
export async function POST(request: NextRequest) {
  try {
    const { url, referer } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    
    const response = await fetch(url, {
      headers: {
        'Referer': referer || 'https://gogoanime.cl/',
        'Origin': referer || 'https://gogoanime.cl',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const data = await response.arrayBuffer();
    
    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
