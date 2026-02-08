'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTopAnime } from '@/lib/api';
import Header from '@/components/layout/Header';

export default function RandomPage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    async function getRandomAnime() {
      try {
        // Get top anime and pick a random one
        const randomPage = Math.floor(Math.random() * 5) + 1;
        const topAnime = await getTopAnime(randomPage, 25);

        if (topAnime.length > 0) {
          const randomIndex = Math.floor(Math.random() * topAnime.length);
          const randomAnime = topAnime[randomIndex];
          const animeId = randomAnime.malId || randomAnime.id;

          router.replace(`/anime/${animeId}`);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to get random anime:', err);
        setError(true);
      }
    }

    getRandomAnime();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f0f0f]">
        <Header />
        <main className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="text-center">
            <svg
              className="w-16 h-16 text-gray-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-medium text-white mb-2">
              Failed to find anime
            </h2>
            <p className="text-gray-400 mb-4">
              Please try again
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors"
            >
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Header />
      <main className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          {/* Dice animation */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <svg
              className="w-full h-full text-violet-500 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>

          <h2 className="text-xl font-medium text-white mb-2">
            Finding random anime...
          </h2>
          <p className="text-gray-400">
            Please wait
          </p>

          {/* Loading spinner */}
          <div className="mt-6">
            <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </main>
    </div>
  );
}
