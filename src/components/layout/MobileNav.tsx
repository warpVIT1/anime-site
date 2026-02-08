"use client";

import Link from 'next/link';
import { useState } from 'react';

export default function MobileNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f0f] border-t border-white/10 flex justify-around items-center h-16 md:hidden shadow-2xl">
        <Link href="/" className="flex flex-col items-center text-xs text-gray-400 hover:text-violet-400 transition-colors">
          <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7m-9 2v8a2 2 0 002 2h4a2 2 0 002-2v-8m-6 0h6" />
          </svg>
          Home
        </Link>
        <Link href="/catalog" className="flex flex-col items-center text-xs text-gray-400 hover:text-violet-400 transition-colors">
          <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Catalog
        </Link>
        <Link href="/seasons" className="flex flex-col items-center text-xs text-gray-400 hover:text-violet-400 transition-colors">
          <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
            <circle cx="12" cy="12" r="10" />
          </svg>
          Seasons
        </Link>
        <Link href="/random" className="flex flex-col items-center text-xs text-gray-400 hover:text-violet-400 transition-colors">
          <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Random
        </Link>
        <button
          type="button"
          className="flex flex-col items-center text-xs text-gray-400 hover:text-violet-400 transition-colors focus:outline-none"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="More"
        >
          <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
          More
        </button>
      </nav>

      {/* Расширенное меню */}
      {menuOpen && (
        <div className="fixed inset-0 z-60 flex items-end justify-center md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
          <div className="relative w-full max-w-sm bg-[#18181b] rounded-t-2xl shadow-2xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <button className="absolute top-3 right-4 text-gray-400 hover:text-violet-400" onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex flex-col gap-4 mt-2">
              <Link href="/login" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-200 hover:bg-violet-600/20 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.797.755 6.879 2.047M15 11a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Profile
              </Link>
              <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-200 hover:bg-violet-600/20 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3M12 2a10 10 0 100 20 10 10 0 000-20z" />
                </svg>
                Settings
              </Link>
              <Link href="/about" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-200 hover:bg-violet-600/20 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
                </svg>
                About
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
