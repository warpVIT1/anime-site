'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';

interface RelatedAnimeItem {
  id: number;
  title: string;
  type: string;
  relation: string;
  image?: string;
  episodes?: number;
  status?: string;
}

interface RelatedAnimeProps {
  relations: RelatedAnimeItem[];
  currentId: number;
}

// Кольори для різних типів зв'язків
const relationColors: Record<string, string> = {
  'Prequel': 'bg-blue-500 text-white',
  'Sequel': 'bg-green-500 text-white',
  'Parent story': 'bg-purple-500 text-white',
  'Side story': 'bg-orange-500 text-white',
  'Alternative version': 'bg-pink-500 text-white',
  'Alternative setting': 'bg-pink-500 text-white',
  'Spin-off': 'bg-yellow-500 text-black',
  'Summary': 'bg-gray-500 text-white',
  'Full story': 'bg-teal-500 text-white',
  'Other': 'bg-gray-600 text-white',
};

export default function RelatedAnime({ relations, currentId }: RelatedAnimeProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  if (!relations || relations.length === 0) {
    return null;
  }

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 300);
    }
  };

  const handleImageError = (id: number) => {
    setImageErrors(prev => new Set(prev).add(id));
  };

  return (
    <div className="mb-12">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
        <span className="w-1 h-6 bg-violet-500 rounded-full" />
        Related Anime
        <span className="text-sm font-normal text-gray-500">({relations.length})</span>
      </h2>

      <div className="relative group">
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/80 hover:bg-violet-600 rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 -translate-x-1/2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Right scroll button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/80 hover:bg-violet-600 rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 translate-x-1/2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Gradient overlays */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-linear-to-r from-[#0a0a0f] to-transparent z-1 pointer-events-none" />
        )}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-linear-to-l from-[#0a0a0f] to-transparent z-1 pointer-events-none" />
        )}

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {relations.map((anime) => {
            const isCurrent = anime.id === currentId;
            const hasError = imageErrors.has(anime.id);

            return (
              <Link
                key={anime.id}
                href={`/anime/${anime.id}`}
                className={`shrink-0 w-36 group/card ${isCurrent ? 'pointer-events-none' : ''}`}
              >
                <div className={`relative aspect-2/3 rounded-xl overflow-hidden bg-gray-800/50 ${isCurrent ? 'ring-2 ring-violet-500' : ''}`}>
                  {anime.image && !hasError ? (
                    <Image
                      src={anime.image}
                      alt={anime.title}
                      fill
                      className="object-cover group-hover/card:scale-105 transition-transform duration-300"
                      onError={() => handleImageError(anime.id)}
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-gray-800 to-gray-900">
                      <span className="text-4xl">🎬</span>
                    </div>
                  )}

                  {/* Relation badge */}
                  <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold ${relationColors[anime.relation] || 'bg-gray-600 text-white'}`}>
                    {anime.relation}
                  </div>

                  {/* Current indicator */}
                  {isCurrent && (
                    <div className="absolute inset-0 bg-violet-600/30 flex items-center justify-center">
                      <span className="px-3 py-1 bg-violet-600 text-white text-xs font-bold rounded-full">
                        Current
                      </span>
                    </div>
                  )}

                  {/* Hover overlay */}
                  {!isCurrent && (
                    <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/40 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover/card:opacity-100 transition-opacity bg-violet-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                        View
                      </span>
                    </div>
                  )}
                </div>

                <h4 className={`mt-2 text-sm font-medium line-clamp-2 transition-colors ${isCurrent ? 'text-violet-400' : 'text-white group-hover/card:text-violet-400'}`}>
                  {anime.title}
                </h4>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Hide scrollbar CSS */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
