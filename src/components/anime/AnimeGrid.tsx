import type { Anime } from '@/types/anime';
import AnimeCard from './AnimeCard';
import Link from 'next/link';

interface AnimeGridProps {
  animes: Anime[];
  title?: string;
  showAllLink?: string;
  showAllText?: string;
}

export default function AnimeGrid({
  animes,
  title,
  showAllLink,
  showAllText = 'Дивитись все'
}: AnimeGridProps) {
  if (!animes || animes.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      {title && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <span className="w-1 h-6 bg-violet-500 rounded-full" />
            {title}
          </h2>
          {showAllLink && (
            <Link
              href={showAllLink}
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              {showAllText} →
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {animes.map((anime) => (
          <AnimeCard key={anime.malId || anime.id} anime={anime} />
        ))}
      </div>
    </section>
  );
}
