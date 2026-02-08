import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getAnimeById, getRecommendations, getRelatedAnime } from '@/lib/api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnimeGrid from '@/components/anime/AnimeGrid';
import RelatedAnime from '@/components/anime/RelatedAnime';
import AnimePlayer from '@/components/anime/AnimePlayer';

interface AnimePageProps {
  params: {
    id: string;
  };
}

function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'ongoing': 'Airing',
    'airing': 'Airing',
    'completed': 'Completed',
    'finished': 'Completed',
    'upcoming': 'Upcoming',
    'not_yet_aired': 'Upcoming',
  };
  return statusMap[status?.toLowerCase()] || status;
}

function translateType(type: string): string {
  const typeMap: Record<string, string> = {
    'tv': 'TV Series',
    'movie': 'Movie',
    'ova': 'OVA',
    'ona': 'ONA',
    'special': 'Special',
    'music': 'Music',
  };
  return typeMap[type?.toLowerCase()] || type;
}

export default async function AnimePage({ params }: AnimePageProps) {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    notFound();
  }

  let anime;
  let recommendations;
  let relatedAnime;

  try {
    [anime, recommendations, relatedAnime] = await Promise.all([
      getAnimeById(id),
      getRecommendations(id),
      getRelatedAnime(id)
    ]);
  } catch (error) {
    console.error('Failed to fetch anime:', error);
    notFound();
  }

  const displayTitle = anime.titleEnglish || anime.title;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Header />

      {anime.banner && (
        <div className="relative h-100 w-full">
          <Image src={anime.banner} alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-linear-to-t from-[#0f0f0f] via-[#0f0f0f]/50 to-transparent" />
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className={anime.banner ? '-mt-48 relative z-10' : 'pt-8'}>
          <div className="flex flex-col md:flex-row gap-8 mb-12">
            <div className="shrink-0">
              <div className="relative w-64 md:w-72 aspect-3/4 rounded-xl overflow-hidden shadow-2xl border-4 border-gray-800">
                <Image src={anime.poster} alt={displayTitle} fill className="object-cover" priority />
              </div>
            </div>

            <div className="flex-1 pt-4">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{displayTitle}</h1>

              {anime.titleOriginal && (
                <p className="text-gray-400 text-lg mb-6">{anime.titleOriginal}</p>
              )}

              <div className="flex flex-wrap gap-3 mb-6">
                {anime.score && anime.score > 0 && (
                  <div className="px-4 py-2 bg-violet-600 rounded-lg">
                    <span className="text-2xl font-bold text-white">{anime.score.toFixed(1)}</span>
                  </div>
                )}

                <div className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
                  <span className="text-gray-400 text-sm block">Type</span>
                  <span className="text-white font-medium">{translateType(anime.type)}</span>
                </div>

                <div className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
                  <span className="text-gray-400 text-sm block">Status</span>
                  <span className="text-white font-medium">{translateStatus(anime.status)}</span>
                </div>

                {anime.episodes && (
                  <div className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
                    <span className="text-gray-400 text-sm block">Episodes</span>
                    <span className="text-white font-medium">{anime.episodes}</span>
                  </div>
                )}

                {anime.year && (
                  <div className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
                    <span className="text-gray-400 text-sm block">Year</span>
                    <span className="text-white font-medium">{anime.year}</span>
                  </div>
                )}

                {anime.duration && (
                  <div className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
                    <span className="text-gray-400 text-sm block">Duration</span>
                    <span className="text-white font-medium">{anime.duration} min</span>
                  </div>
                )}
              </div>

              {anime.genres && anime.genres.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-gray-400 text-sm mb-2">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {anime.genres.map((genre: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-sm text-gray-300">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {anime.studios && anime.studios.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-gray-400 text-sm mb-2">Studio</h3>
                  <p className="text-white">{anime.studios.join(', ')}</p>
                </div>
              )}
            </div>
          </div>

          {anime.description && (
            <div className="mb-12 p-6 bg-gray-800/50 rounded-xl border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Synopsis</h2>
              <p className="text-gray-300 leading-relaxed">{anime.description}</p>
            </div>
          )}

          {anime.trailer?.id && (
            <div className="mb-12">
              <h2 className="text-xl font-bold text-white mb-4">Trailer</h2>
              <div className="aspect-video max-w-4xl rounded-xl overflow-hidden border border-gray-700">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${anime.trailer.id}`}
                  title="Trailer"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors">
              ← Back to Home
            </Link>
          </div>

          {relatedAnime && relatedAnime.length > 0 && (
            <RelatedAnime relations={relatedAnime} currentId={id} />
          )}

          {/* Anime Player Section */}
          <AnimePlayer
            malId={id}
            anilistId={anime.anilistId}
            title={displayTitle}
            totalEpisodes={anime.episodes}
            type={anime.type}
            status={anime.status}
            nextAiringEpisode={anime.nextAiringEpisode}
          />

          {recommendations && recommendations.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="w-1 h-6 bg-violet-500 rounded-full" />
                Similar Anime
              </h2>
              <AnimeGrid animes={recommendations.slice(0, 12)} />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export async function generateMetadata({ params }: AnimePageProps): Promise<Metadata> {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    return { title: 'Not Found | ANIHUB' };
  }

  try {
    const anime = await getAnimeById(id);
    const displayTitle = anime.titleEnglish || anime.title;
    return {
      title: `${displayTitle} | ANIHUB`,
      description: anime.description || `Watch ${displayTitle} on ANIHUB`
    };
  } catch {
    return { title: 'Anime | ANIHUB' };
  }
}
