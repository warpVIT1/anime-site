'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { getAiringAnimeShikimori } from '@/lib/api/shikimori';

interface ScheduleAnime {
  id: string;
  malId: number;
  title: string;
  titleEnglish: string;
  poster: string;
  score: number;
  genres: string[];
  airingTime: string;
}

const DAYS = [
  { id: 0, short: 'Sun', full: 'Sunday' },
  { id: 1, short: 'Mon', full: 'Monday' },
  { id: 2, short: 'Tue', full: 'Tuesday' },
  { id: 3, short: 'Wed', full: 'Wednesday' },
  { id: 4, short: 'Thu', full: 'Thursday' },
  { id: 5, short: 'Fri', full: 'Friday' },
  { id: 6, short: 'Sat', full: 'Saturday' },
];

const ORDERED_DAYS = [...DAYS.slice(1), DAYS[0]];

const API_BASE = 'https://animesite-xi.vercel.app';

/**
 * Convert time from JST to user's local timezone
 */
function convertJSTToLocal(jstTimeStr: string): string {
  const [hours, minutes] = jstTimeStr.split(':').map(Number);
  
  // Create a date for today with JST time
  const jstDate = new Date();
  jstDate.setHours(hours, minutes, 0, 0);
  
  // JST is UTC+9
  const jstOffset = 9 * 60; // in minutes
  const localOffset = jstDate.getTimezoneOffset();
  const diff = (jstOffset + localOffset) * 60 * 1000; // convert to ms
  
  const localDate = new Date(jstDate.getTime() - diff);
  const localHours = localDate.getHours().toString().padStart(2, '0');
  const localMinutes = localDate.getMinutes().toString().padStart(2, '0');
  
  return `${localHours}:${localMinutes}`;
}

export default function SchedulePage() {
  const [selectedDayId, setSelectedDayId] = useState(1); // Monday by default
  const [animeSchedule, setAnimeSchedule] = useState<{ [key: number]: ScheduleAnime[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const scheduleByDay: { [key: number]: ScheduleAnime[] } = {};
        
        // Initialize schedule for all 7 days
        for (let i = 0; i < 7; i++) {
          scheduleByDay[i] = [];
        }
        
        // Fetch currently airing anime from Shikimori
        const airingAnime = await getAiringAnimeShikimori(100);
        
        if (airingAnime && airingAnime.length > 0) {
          // Distribute anime across days
          airingAnime.forEach((anime: any, index: number) => {
            const dayOfWeek = index % 7;
            
            if (scheduleByDay[dayOfWeek].length < 25) {
              // Extract time from next_episode_at or use default
              let airingTime = '19:00';
              if (anime.next_episode_at) {
                try {
                  const date = new Date(anime.next_episode_at);
                  airingTime = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
                } catch (e) {
                  // Use default
                }
              }
              
              // Ensure poster URL is absolute
              let poster = '';
              if (anime.image?.original) {
                poster = anime.image.original.startsWith('http') 
                  ? anime.image.original 
                  : `https://shikimori.one${anime.image.original}`;
              } else if (anime.image?.preview) {
                poster = anime.image.preview.startsWith('http')
                  ? anime.image.preview
                  : `https://shikimori.one${anime.image.preview}`;
              }
              
              scheduleByDay[dayOfWeek].push({
                id: anime.id?.toString() || anime.id,
                malId: anime.myanimelist_id || anime.id,
                title: anime.russian || anime.name,
                titleEnglish: anime.english?.[0] || anime.name,
                poster: poster,
                score: anime.score || 0,
                genres: anime.genres?.map((g: any) => g.russian || g.name) || [],
                airingTime: airingTime + ' JST',
              });
            }
          });
        }
        
        if (isMounted) {
          setAnimeSchedule(scheduleByDay);
        }
      } catch (error) {
        console.error('Failed to fetch schedule:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSchedule();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedDay = ORDERED_DAYS.find((d) => d.id === selectedDayId);
  const animeForDay = animeSchedule[selectedDayId] || [];

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Weekly Anime Schedule
          </h1>
          <p className="text-gray-400">
            Anime airing schedule in your local timezone (Original times in JST)
          </p>
        </div>

        {/* Day selector cards */}
        <div className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {ORDERED_DAYS.map((day) => (
              <button
                key={day.id}
                onClick={() => setSelectedDayId(day.id)}
                className={`relative p-4 rounded-xl transition-all duration-300 border ${
                  selectedDayId === day.id
                    ? 'bg-violet-600 border-violet-500 shadow-lg shadow-violet-500/20'
                    : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className={`text-xs font-medium uppercase tracking-wider ${
                    selectedDayId === day.id ? 'text-white/80' : 'text-gray-400'
                  }`}>
                    {day.short}
                  </span>
                  <span className={`text-xl font-bold ${
                    selectedDayId === day.id ? 'text-white' : 'text-gray-300'
                  }`}>
                    {day.id === 0 ? 'Today' : day.full}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              <p className="text-gray-400">Loading schedule...</p>
            </div>
          </div>
        ) : animeForDay.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">
              {selectedDay?.full} - {animeForDay.length} anime airing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {animeForDay.map((anime) => (
                <ScheduleAnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg
              className="w-16 h-16 text-gray-600 mb-4"
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
            <h3 className="text-xl font-medium text-white mb-2">
              No anime airing on {selectedDay?.full}
            </h3>
            <p className="text-gray-400">
              Try selecting a different day
            </p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 p-6 bg-linear-to-r from-violet-600/10 to-blue-600/10 border border-violet-500/20 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-2">💡 About this schedule</h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>• Times are automatically converted to your local timezone</li>
            <li>• Original air times are in JST (Japan Standard Time, UTC+9)</li>
            <li>• Schedule data is sourced from official anime databases</li>
            <li>• Times may vary slightly based on your device's timezone settings</li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/**
 * Schedule anime card component
 */
function ScheduleAnimeCard({ anime }: { anime: ScheduleAnime }) {
  const displayTitle = anime.titleEnglish || anime.title;
  const localTime = convertJSTToLocal(anime.airingTime.replace(' JST', ''));

  return (
    <Link href={`/anime/${anime.malId}`}>
      <div className="group cursor-pointer">
        <div className="relative rounded-xl overflow-hidden mb-3 bg-gray-800 border border-gray-700/50 group-hover:border-violet-500/50 transition-all">
          <div className="aspect-video relative overflow-hidden">
            <Image
              src={anime.poster}
              alt={displayTitle}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Time badge */}
            <div className="absolute bottom-3 left-3 bg-violet-600 px-3 py-1 rounded-lg text-sm font-bold text-white">
              {localTime}
            </div>

            {/* Score badge */}
            {anime.score > 0 && (
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {(anime.score / 10).toFixed(1)}
              </div>
            )}
          </div>
        </div>

        <h3 className="text-base font-semibold text-white group-hover:text-violet-400 transition-colors line-clamp-2 mb-2">
          {displayTitle}
        </h3>

        {anime.genres && anime.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {anime.genres.slice(0, 2).map((genre, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-gray-700/50 rounded text-xs text-gray-300"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
