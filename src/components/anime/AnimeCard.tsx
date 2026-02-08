'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Anime } from '@/types/anime';

interface AnimeCardProps {
  anime: Anime;
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  const animeId = anime.malId || anime.id;
  const displayTitle = anime.titleEnglish || anime.title;

  const typeLabel: Record<string, string> = {
    tv: 'TV',
    movie: 'Movie',
    ova: 'OVA',
    ona: 'ONA',
    special: 'Special',
  };

  return (
    <Link href={`/anime/${animeId}`} className="block group">
      <div className="card-hover">
        <div className="relative aspect-3/4 rounded-lg overflow-hidden mb-3 bg-gray-800">
          <Image
            src={anime.poster}
            alt={displayTitle}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
          />

          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

          {anime.score && anime.score > 0 && (
            <div className="absolute top-2 left-2 bg-violet-600 px-2 py-1 rounded text-xs font-bold text-white">
              {anime.score.toFixed(1)}
            </div>
          )}

          {anime.type && (
            <div className="absolute top-2 right-2 bg-gray-900/80 px-2 py-1 rounded text-xs text-gray-300">
              {typeLabel[anime.type.toLowerCase()] || anime.type}
            </div>
          )}

          {anime.year && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-300">
              {anime.year}
            </div>
          )}

          {anime.status === 'ongoing' && (
            <div className="absolute bottom-2 left-2 bg-green-600 px-2 py-1 rounded text-[10px] font-semibold text-white uppercase">
              Airing
            </div>
          )}
        </div>

        <h3 className="text-sm font-medium text-white leading-tight line-clamp-2 group-hover:text-violet-400 transition-colors">
          {displayTitle}
        </h3>
      </div>
    </Link>
  );
}
