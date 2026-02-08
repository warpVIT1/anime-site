// Утиліти для роботи з API

// Затримка для rate limiting
export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

// Rate limiter для API запитів
class RateLimiter {
  private lastRequestTime = 0;
  private minInterval: number;

  constructor(requestsPerSecond: number) {
    this.minInterval = 1000 / requestsPerSecond;
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minInterval) {
      await delay(this.minInterval - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
  }
}

// Rate limiters для різних API
export const jikanLimiter = new RateLimiter(3); // 3 запити/сек
export const anilistLimiter = new RateLimiter(30); // 30 запитів/сек
export const kitsuLimiter = new RateLimiter(5); // 5 запитів/сек

// Fetch з автоматичним retry
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        next: { revalidate: 3600 }, // Кеш на 1 годину
      });

      if (!response.ok && i < retries - 1) {
        // Якщо помилка і є ще спроби, чекаємо і пробуємо знову
        await delay(1000 * (i + 1));
        continue;
      }

      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await delay(1000 * (i + 1));
    }
  }

  throw new Error(`Failed to fetch after ${retries} retries`);
}

// Normalize score з різних API до шкали 0-10
export function normalizeScore(score: number | undefined, maxScore: number = 10): number | undefined {
  if (!score) return undefined;

  if (maxScore === 100) {
    return Math.round((score / 10) * 10) / 10; // 0-100 -> 0-10
  }

  return Math.round(score * 10) / 10;
}

// Конвертація сезону
export function normalizeSeason(season: string | undefined): 'winter' | 'spring' | 'summer' | 'fall' | undefined {
  if (!season) return undefined;

  const normalized = season.toLowerCase();

  if (normalized.includes('winter')) return 'winter';
  if (normalized.includes('spring')) return 'spring';
  if (normalized.includes('summer')) return 'summer';
  if (normalized.includes('fall') || normalized.includes('autumn')) return 'fall';

  return undefined;
}

// Конвертація статусу
export function normalizeStatus(status: string | undefined): 'ongoing' | 'completed' | 'announced' {
  if (!status) return 'announced';

  const normalized = status.toLowerCase();

  if (normalized.includes('airing') || normalized.includes('current') || normalized.includes('releasing')) {
    return 'ongoing';
  }

  if (normalized.includes('finished') || normalized.includes('complete')) {
    return 'completed';
  }

  return 'announced';
}

// Конвертація типу
export function normalizeType(type: string | undefined): 'tv' | 'movie' | 'ova' | 'ona' | 'special' | 'music' {
  if (!type) return 'tv';

  const normalized = type.toLowerCase();

  if (normalized.includes('tv')) return 'tv';
  if (normalized.includes('movie')) return 'movie';
  if (normalized.includes('ova')) return 'ova';
  if (normalized.includes('ona')) return 'ona';
  if (normalized.includes('special')) return 'special';
  if (normalized.includes('music')) return 'music';

  return 'tv';
}

// Витягнути рік з дати
export function extractYear(dateString: string | undefined): number | undefined {
  if (!dateString) return undefined;

  const year = parseInt(dateString.substring(0, 4));
  return isNaN(year) ? undefined : year;
}

// Очистити HTML теги з опису
export function stripHtmlTags(html: string | undefined): string | undefined {
  if (!html) return undefined;

  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}
