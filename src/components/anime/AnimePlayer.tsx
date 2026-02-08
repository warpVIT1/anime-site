'use client';

import { useState, useEffect, useRef } from 'react';

interface AnimePlayerProps {
  malId: number;
  anilistId?: number;
  title: string;
  totalEpisodes?: number;
  type?: string;
  status?: string;
  nextAiringEpisode?: { episode: number; airingAt: number } | null;
}

interface EmbedProvider {
  id: string;
  name: string;
  getUrl: (malId: number, episode: number, isDub: boolean) => string;
}

// Working embed providers (January 2026)
const EMBED_PROVIDERS: EmbedProvider[] = [
  {
    id: '2embed',
    name: '2Embed',
    getUrl: (malId, episode) => `https://www.2embed.cc/embedanime/mal-${malId}&ep=${episode}`,
  },
  {
    id: 'vidsrc',
    name: 'VidSrc',
    getUrl: (malId, episode) => `https://vidsrc.xyz/embed/anime/mal-${malId}/${episode}`,
  },
  {
    id: 'vidsrcpro',
    name: 'VidSrc Pro',
    getUrl: (malId, episode) => `https://vidsrc.pro/embed/anime/${malId}/${episode}`,
  },
  {
    id: 'autoembed',
    name: 'AutoEmbed',
    getUrl: (malId, episode) => `https://autoembed.cc/anime/mal/${malId}-${episode}`,
  },
];

// External sites for fallback
const EXTERNAL_SITES = [
  { name: 'HiAnime', url: (title: string) => `https://hianime.to/search?keyword=${encodeURIComponent(title)}`, color: 'bg-purple-600' },
  { name: 'AniWave', url: (title: string) => `https://aniwave.to/filter?keyword=${encodeURIComponent(title)}`, color: 'bg-blue-600' },
  { name: 'Gogoanime', url: (title: string) => `https://anitaku.pe/search.html?keyword=${encodeURIComponent(title)}`, color: 'bg-green-600' },
  { name: '9Anime', url: (title: string) => `https://9animetv.to/search?keyword=${encodeURIComponent(title)}`, color: 'bg-red-600' },
];

function getTimeUntilNextEpisode(nextAiringTimestamp: number): string {
  const now = Date.now() / 1000;
  const diff = nextAiringTimestamp - now;
  
  if (diff <= 0) return 'Airing now';
  
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function AnimePlayer({ 
  malId, 
  anilistId,
  title,
  totalEpisodes, 
  type,
  status,
  nextAiringEpisode 
}: AnimePlayerProps) {
  const [selectedProvider, setSelectedProvider] = useState(0);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [isDub, setIsDub] = useState(false);
  const [episodeRangeStart, setEpisodeRangeStart] = useState(0);
  const [timeUntilNext, setTimeUntilNext] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExternalLinks, setShowExternalLinks] = useState(false);
  const [failedProviders, setFailedProviders] = useState<Set<number>>(new Set());
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isMovie = type?.toLowerCase() === 'movie';
  const isOngoing = status?.toLowerCase() === 'ongoing' || status?.toLowerCase() === 'airing';
  const epCount = totalEpisodes || 1;
  const episodesPerPage = 100;
  
  // Update countdown timer
  useEffect(() => {
    if (!nextAiringEpisode?.airingAt || !isOngoing) return;
    
    const updateTimer = () => {
      setTimeUntilNext(getTimeUntilNextEpisode(nextAiringEpisode.airingAt));
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [nextAiringEpisode, isOngoing]);

  // Reset loading when episode/provider changes
  useEffect(() => {
    setIsLoading(true);
  }, [selectedEpisode, selectedProvider, isDub]);

  // Auto-switch provider on timeout
  useEffect(() => {
    if (!isLoading || showExternalLinks) return;
    
    const timeout = setTimeout(() => {
      if (isLoading) {
        handleProviderFailed();
      }
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, [isLoading, selectedProvider, showExternalLinks]);

  const handleProviderFailed = () => {
    const newFailedProviders = new Set(failedProviders);
    newFailedProviders.add(selectedProvider);
    setFailedProviders(newFailedProviders);
    
    // Find next working provider
    const nextProvider = EMBED_PROVIDERS.findIndex((_, i) => !newFailedProviders.has(i) && i !== selectedProvider);
    
    if (nextProvider !== -1) {
      setSelectedProvider(nextProvider);
    } else {
      setShowExternalLinks(true);
      setIsLoading(false);
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const currentProvider = EMBED_PROVIDERS[selectedProvider];
  const embedUrl = currentProvider?.getUrl(malId, selectedEpisode, isDub) || '';

  // Episode pagination
  const episodeRanges: { start: number; end: number }[] = [];
  for (let i = 0; i < epCount; i += episodesPerPage) {
    episodeRanges.push({
      start: i + 1,
      end: Math.min(i + episodesPerPage, epCount),
    });
  }

  const currentRangeStart = episodeRangeStart * episodesPerPage + 1;
  const currentRangeEnd = Math.min((episodeRangeStart + 1) * episodesPerPage, epCount);
  const displayedEpisodes: number[] = [];
  for (let i = currentRangeStart; i <= currentRangeEnd; i++) {
    displayedEpisodes.push(i);
  }

  const retryAllProviders = () => {
    setFailedProviders(new Set());
    setShowExternalLinks(false);
    setSelectedProvider(0);
    setIsLoading(true);
  };

  return (
    <div className="mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-3">
          <span className="w-1 h-6 bg-violet-500 rounded-full" />
          Watch {isMovie ? 'Movie' : 'Anime'}
        </h2>
        
        {isOngoing && nextAiringEpisode && timeUntilNext && (
          <div className="flex items-center gap-2 px-4 py-2 bg-violet-600/20 border border-violet-500/30 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-300">EP {nextAiringEpisode.episode} in</span>
            <span className="text-sm font-bold text-violet-400">{timeUntilNext}</span>
          </div>
        )}
      </div>

      <div className="bg-gray-900/80 rounded-2xl border border-gray-800 overflow-hidden">
        {/* Video Player */}
        <div className="relative aspect-video bg-black">
          {/* Loading Spinner */}
          {isLoading && !showExternalLinks && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-950 z-10">
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-violet-500/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-500 animate-spin"></div>
                </div>
                <p className="text-gray-400 text-sm">Loading {currentProvider?.name}...</p>
                <p className="text-gray-600 text-xs">Server {selectedProvider + 1} of {EMBED_PROVIDERS.length}</p>
              </div>
            </div>
          )}

          {/* External Links Fallback */}
          {showExternalLinks && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-black z-20">
              <div className="text-center p-8 max-w-2xl">
                <svg className="w-16 h-16 mx-auto text-violet-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                
                <h3 className="text-xl font-bold text-white mb-2">Watch on External Site</h3>
                <p className="text-gray-400 mb-6">Embedded players unavailable. Click below to watch:</p>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {EXTERNAL_SITES.map((site) => (
                    <a
                      key={site.name}
                      href={site.url(title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 px-4 py-3 ${site.color} hover:opacity-90 text-white rounded-xl font-medium transition-all hover:scale-105`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      {site.name}
                    </a>
                  ))}
                </div>
                
                <button
                  onClick={retryAllProviders}
                  className="text-violet-400 hover:text-violet-300 text-sm underline"
                >
                  Try embedded players again
                </button>
              </div>
            </div>
          )}

          {/* Iframe Player */}
          {!showExternalLinks && embedUrl && (
            <iframe
              ref={iframeRef}
              key={`${selectedProvider}-${selectedEpisode}-${isDub}`}
              src={embedUrl}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="origin"
              onLoad={handleIframeLoad}
            />
          )}
          
          {/* Episode Badge */}
          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-700 z-30 pointer-events-none">
            <span className="text-sm text-white font-medium">
              {isMovie ? 'Movie' : `EP ${selectedEpisode}`} • {isDub ? 'DUB' : 'SUB'}
            </span>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="p-4 space-y-4">
          {/* Provider & Audio Selection Row */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Providers */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                </svg>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Server</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {EMBED_PROVIDERS.map((provider, index) => (
                  <button
                    key={provider.id}
                    onClick={() => {
                      setSelectedProvider(index);
                      setShowExternalLinks(false);
                      setIsLoading(true);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedProvider === index && !showExternalLinks
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                        : failedProviders.has(index)
                        ? 'bg-gray-800/50 text-gray-600 line-through'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {provider.name}
                  </button>
                ))}
                <button
                  onClick={() => setShowExternalLinks(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    showExternalLinks
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  External ↗
                </button>
              </div>
            </div>

            {/* Audio Toggle */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Audio</span>
              </div>
              <div className="flex rounded-lg overflow-hidden border border-gray-700">
                <button
                  onClick={() => setIsDub(false)}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    !isDub ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  SUB
                </button>
                <button
                  onClick={() => setIsDub(true)}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    isDub ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  DUB
                </button>
              </div>
            </div>
          </div>

          {/* Episode Selection */}
          {!isMovie && epCount > 1 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Episodes</span>
                  <span className="text-xs text-gray-600">({epCount} total)</span>
                </div>

                {episodeRanges.length > 1 && (
                  <div className="flex gap-1">
                    {episodeRanges.map((range, index) => (
                      <button
                        key={index}
                        onClick={() => setEpisodeRangeStart(index)}
                        className={`px-3 py-1 text-xs rounded-md transition-all ${
                          episodeRangeStart === index
                            ? 'bg-violet-600 text-white'
                            : 'bg-gray-800 text-gray-500 hover:text-white'
                        }`}
                      >
                        {range.start}-{range.end}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-15 lg:grid-cols-20 gap-1.5 max-h-48 overflow-y-auto p-1">
                {displayedEpisodes.map((ep) => (
                  <button
                    key={ep}
                    onClick={() => {
                      setSelectedEpisode(ep);
                      setFailedProviders(new Set());
                      setShowExternalLinks(false);
                    }}
                    className={`aspect-square flex items-center justify-center rounded-md text-sm font-medium transition-all ${
                      selectedEpisode === ep
                        ? 'bg-violet-600 text-white ring-2 ring-violet-400 ring-offset-1 ring-offset-gray-900'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {ep}
                  </button>
                ))}
              </div>

              {/* Episode Navigation */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                <button
                  onClick={() => {
                    if (selectedEpisode > 1) {
                      setSelectedEpisode(selectedEpisode - 1);
                      setFailedProviders(new Set());
                      setShowExternalLinks(false);
                    }
                  }}
                  disabled={selectedEpisode <= 1}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                <span className="text-gray-500 text-sm">
                  Episode <span className="text-white font-medium">{selectedEpisode}</span> of {epCount}
                </span>

                <button
                  onClick={() => {
                    if (selectedEpisode < epCount) {
                      setSelectedEpisode(selectedEpisode + 1);
                      setFailedProviders(new Set());
                      setShowExternalLinks(false);
                    }
                  }}
                  disabled={selectedEpisode >= epCount}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-950/50 border-t border-gray-800">
          <p className="text-xs text-gray-600 text-center">
            {title} • If video doesn&apos;t load, try another server or use External links
          </p>
        </div>
      </div>
    </div>
  );
}
