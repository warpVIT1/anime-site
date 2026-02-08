/**
 * ===============================================
 * Utility functions & helpers
 * ===============================================
 * @author warpVIT
 *
 * a collection of stuff i use across the app
 * some of this is probably overengineered but hey it works
 */

// ===============================================
// ASYNC HELPERS
// ===============================================

/**
 * promisified setTimeout - nothing fancy
 * used everywhere for delays
 */
export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Simple rate limiter for API requests
 *
 * jikan has strict limits (3 req/sec), learned this the hard way
 * when i got 429'd like 50 times in a row lol
 */
class RateLimiter {
  private lastReq = 0;
  private interval: number;

  constructor(reqPerSec: number) {
    // convert to ms between requests
    this.interval = 1000 / reqPerSec;
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastReq;

    // wait if we're going too fast
    if (elapsed < this.interval) {
      await delay(this.interval - elapsed);
    }

    this.lastReq = Date.now();
  }
}

// API rate limiters
// values from the docs (mostly)
export const jikanLimiter = new RateLimiter(3);    // jikan is strict af
export const anilistLimiter = new RateLimiter(30); // anilist is chill
export const kitsuLimiter = new RateLimiter(5);    // somewhere in between

/**
 * fetch with automatic retry on failure
 *
 * uses exponential-ish backoff (1s, 2s, 3s...)
 * the revalidate option is for next.js caching
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        // cache for 1 hour - reduces api calls
        next: { revalidate: 3600 }
      });

      // if its a client error (4xx), no point retrying
      // except 429 (rate limit) which we should retry
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        return res;
      }

      if (!res.ok && attempt < maxRetries - 1) {
        // wait before retry, longer each time
        await delay(1000 * (attempt + 1));
        continue;
      }

      return res;
    } catch (err) {
      lastError = err as Error;

      // network error, retry
      if (attempt < maxRetries - 1) {
        console.warn(`[fetchWithRetry] attempt ${attempt + 1} failed, retrying...`);
        await delay(1000 * (attempt + 1));
      }
    }
  }

  // all retries failed
  throw lastError ?? new Error(`fetch failed after ${maxRetries} attempts: ${url}`);
}

// ===============================================
// DATA NORMALIZATION
// different APIs return data in different formats
// these functions normalize everything to our types
// ===============================================

type Season = 'winter' | 'spring' | 'summer' | 'fall';
type Status = 'ongoing' | 'completed' | 'announced';
type AnimeType = 'tv' | 'movie' | 'ova' | 'ona' | 'special' | 'music';

/**
 * normalize score to 0-10 scale
 * some apis use 0-100, some use 0-10
 */
export function normalizeScore(score: number | undefined, max = 10): number | undefined {
  if (!score || score <= 0) return undefined;

  // handle 0-100 scale (like some anilist responses)
  if (max === 100) {
    return Math.round(score / 10 * 10) / 10;
  }

  // already 0-10, just round to 1 decimal
  return Math.round(score * 10) / 10;
}

/**
 * normalize season string to our enum
 * handles various formats like "WINTER", "winter", "Winter 2024"
 */
export function normalizeSeason(season: string | undefined): Season | undefined {
  if (!season) return undefined;

  const s = season.toLowerCase();

  // simple includes checks - handles most formats
  if (s.includes('winter')) return 'winter';
  if (s.includes('spring')) return 'spring';
  if (s.includes('summer')) return 'summer';
  if (s.includes('fall') || s.includes('autumn')) return 'fall';

  return undefined;
}

/**
 * normalize status to our enum
 * each api calls these differently of course
 */
export function normalizeStatus(status: string | undefined): Status {
  if (!status) return 'announced';

  const s = status.toLowerCase();

  // ongoing variants
  if (s.includes('airing') || s.includes('current') || s.includes('releasing')) {
    return 'ongoing';
  }

  // completed variants
  if (s.includes('finished') || s.includes('complete')) {
    return 'completed';
  }

  // default to announced for anything else
  // (not yet aired, upcoming, etc)
  return 'announced';
}

/**
 * normalize media type
 * tv is the default cuz thats most anime
 */
export function normalizeType(type: string | undefined): AnimeType {
  if (!type) return 'tv';

  const t = type.toLowerCase();

  // check specific types first
  if (t.includes('movie')) return 'movie';
  if (t.includes('ova')) return 'ova';
  if (t.includes('ona')) return 'ona';
  if (t.includes('special')) return 'special';
  if (t.includes('music')) return 'music';

  // everything else is probably tv
  return 'tv';
}

// ===============================================
// STRING HELPERS
// ===============================================

/**
 * extract year from date string
 * assumes ISO format (YYYY-MM-DD) or at least starts with year
 */
export function extractYear(dateStr: string | undefined): number | undefined {
  if (!dateStr) return undefined;

  // try parsing first 4 chars as year
  const year = parseInt(dateStr.substring(0, 4), 10);

  // sanity check - anime didnt exist before 1900 lol
  // and anything after 2100 is probably wrong
  if (isNaN(year) || year < 1900 || year > 2100) {
    return undefined;
  }

  return year;
}

/**
 * strip html tags and decode entities
 * for cleaning up descriptions from apis
 *
 * yeah i know this isnt perfect but good enough
 * a proper html parser would be overkill
 */
export function stripHtmlTags(html: string | undefined): string | undefined {
  if (!html) return undefined;

  return html
    // remove all html tags
    .replace(/<[^>]*>/g, '')
    // decode common html entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    // clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * truncate string to max length with ellipsis
 * useful for descriptions and titles
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

/**
 * format number with commas (1000 -> 1,000)
 * for displaying member counts etc
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

// ===============================================
// MISC
// ===============================================

/**
 * simple debounce function
 * used for search input
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), wait);
  };
}

/**
 * check if we're on client side
 * needed sometimes for next.js stuff
 */
export const isClient = typeof window !== 'undefined';

/**
 * get random item from array
 * used for random anime feature
 */
export function randomItem<T>(arr: T[]): T | undefined {
  if (!arr.length) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

// easter egg: if you found this you're a real one
// - warpVIT, 2026
