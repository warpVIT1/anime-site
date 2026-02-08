'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getPopularSchedule } from '@/lib/api/jikan';

interface ScheduleAnime {
  id: number;
  malId: number;
  title: string;
  titleEnglish: string;
  poster: string;
  score: number;
  broadcastDay: string;
  broadcastTime: string;
  genres: string[];
}

/**
 * Map broadcast day name to day index (0=Sunday, 6=Saturday)
 */
function getDayIndex(broadcastDay: string): number {
  const dayMap: Record<string, number> = {
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6,
  };
  return dayMap[broadcastDay.toLowerCase()] || 0;
}

/**
 * Get next 14 days starting from today
 */
function getNext14Days() {
  const dayShorts = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayFulls = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const days: any[] = [];

  for (let i = 0; i < 14; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    const dayOfWeek = date.getDay();
    days.push({
      date,
      dayShort: dayShorts[dayOfWeek],
      dayFull: dayFulls[dayOfWeek],
      dateNum: date.getDate(),
      dayIndex: dayOfWeek,
    });
  }

  return days;
}

export default function ScheduleSection({ isOpen = true }: { isOpen?: boolean }) {
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState(isOpen);
  const [scheduleData, setScheduleData] = useState<ScheduleAnime[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const days = getNext14Days();

  useEffect(() => {
    let isMounted = true;

    const fetchSchedule = async () => {
      try {
        setIsLoading(true);
        const data = await getPopularSchedule();
        
        if (isMounted && data) {
          setScheduleData(data);
        }
      } catch (error) {
        console.error('Failed to fetch schedule:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSchedule();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter anime by selected day
  const selectedDayFull = days[selectedDay].dayFull;
  const animeForDay = scheduleData.filter(
    anime => anime.broadcastDay.toLowerCase() === selectedDayFull.toLowerCase()
  );

  return (
    <div className="p-4">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between mb-4 cursor-pointer group">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight leading-tight">
            Anime Schedule
          </h2>
          <p className="text-[11px] text-white/40 font-medium">
            Broadcasting schedule for current season
          </p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`rounded-full p-2 text-white/30 transition-all duration-300 hover:bg-white/5 hover:text-white cursor-pointer ${
            isExpanded ? '' : 'rotate-180'
          } ${isExpanded ? 'bg-white/5 text-white/60' : ''}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>

      {/* Expandable content */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: isExpanded ? '1000px' : '0px',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className="mb-2.5">
          {/* Day selector */}
          <div className="max-w-220 mx-auto relative">
            <div className="flex gap-3 items-center justify-center px-2 pt-5 pb-2 overflow-x-auto">
              {days.map((day, index) => {
                const isSelected = index === selectedDay;

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDay(index)}
                    className={`relative group flex flex-col items-center justify-center rounded-xl transition-all duration-300 border cursor-pointer w-12 h-12 shrink-0 backdrop-blur-sm ${
                      isSelected
                        ? 'bg-white/14 text-white border-white/22 shadow-[0_0_12px_rgba(255,255,255,0.12)] scale-[1.04] z-10'
                        : 'bg-white/6 text-white/40 border-white/10 hover:bg-white/10 hover:text-white/80 hover:border-white/20'
                    }`}
                  >
                    <span className="text-[10px] font-medium uppercase tracking-wider leading-none mb-0.5 text-white/60">
                      {day.dayShort}
                    </span>
                    <span className="text-base font-bold leading-none text-white">
                      {day.dateNum}
                    </span>
                    <div className="absolute -bottom-6 left-1/2 w-px h-6 -translate-x-1/2 bg-white/10"></div>
                  </button>
                );
              })}
            </div>

            {/* Divider line */}
            <div className="w-full h-px bg-white/3 mt-4"></div>
          </div>

          {/* Anime list for selected day */}
          <div className="min-h-50">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-white/40">Loading schedule...</div>
              </div>
            ) : animeForDay.length > 0 ? (
              <div
                style={{
                  opacity: 1,
                  transform: 'none',
                }}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-4">
                  {animeForDay.map((anime) => (
                    <ScheduleAnimeCard key={anime.malId} anime={anime} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-white/40">No anime airing on {selectedDayFull}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Schedule anime card component
 */
function ScheduleAnimeCard({ anime }: { anime: ScheduleAnime }) {
  const displayTitle = anime.titleEnglish || anime.title;

  return (
    <Link href={`/anime/${anime.malId}`}>
      <div className="group block h-full">
        <div className="relative flex h-full items-center gap-4 rounded-2xl bg-white/5 p-3 border border-white/5 transition-all duration-300 hover:bg-white/10 hover:border-white/10 hover:shadow-[0_4px_22px_rgba(0,0,0,0.28)] hover:-translate-y-0.5 overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-r from-violet-600/0 via-violet-600/5 to-violet-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Time badge */}
          <div className="shrink-0 relative z-10">
            <div className="flex flex-col items-center justify-center rounded-xl bg-black/20 px-3 py-2 border border-white/5 min-w-14 backdrop-blur-sm group-hover:border-white/10 transition-colors">
              <span className="text-sm font-bold text-white tracking-tight">{anime.broadcastTime}</span>
            </div>
          </div>

          {/* Poster image */}
          <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-900 shadow-sm group-hover:shadow-md transition-all">
            {anime.poster && (
              <Image
                alt={displayTitle || 'Anime'}
                src={anime.poster}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                unoptimized
              />
            )}
          </div>

          {/* Info */}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 relative z-10">
            <h3 className="truncate text-sm font-bold text-white transition-colors group-hover:text-violet-200">
              {displayTitle}
            </h3>
            <div className="flex items-center gap-2">
              {anime.score > 0 && (
                <span className="inline-flex items-center rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/60 border border-white/5 group-hover:bg-white/10 transition-colors">
                  ⭐ {anime.score.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="shrink-0 text-white/10 transition-all duration-300 group-hover:text-white/40 group-hover:translate-x-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z"
                clipRule="evenodd"
              ></path>
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
