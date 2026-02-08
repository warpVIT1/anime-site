'use client';

/**
 * Site header component
 * @author warpVIT
 *
 * handles: logo, nav, search, user auth stuff
 *
 * note to self: the profile dropdown was pain in the ass to position
 * DO NOT refactor without testing on mobile first
 */

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import clsx from 'clsx';

// lucide icons ftw
import {
  Search, Bell, Shuffle, Menu, X,
  User, Heart, ClipboardList, Clock, Settings, LogOut,
  ChevronDown
} from 'lucide-react';

// nav links config - easier to maintain this way
const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/catalog', label: 'Catalog' },
  { href: '/top', label: 'Top' },
  { href: '/seasons', label: 'Seasons' },
] as const;

export default function Header() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();

  // local state
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  // close profile menu on outside click
  // extracted to useCallback cuz eslint was yelling at me
  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
      setIsProfileOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [handleOutsideClick]);

  // search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    // using window.location instead of router.push
    // cuz it triggers a full page reload which clears stale state
    // kinda hacky but works
    window.location.href = `/catalog?search=${encodeURIComponent(q)}`;
  };

  // logout handler
  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileOpen(false);
      router.push('/');
    } catch (err) {
      // silently fail, user will see they're still logged in
      console.error('[Header] logout failed:', err);
    }
  };

  // get user initials for avatar
  const getUserInitial = () => {
    if (!user) return '?';
    return (user.displayName?.charAt(0) || user.username?.charAt(0) || 'U').toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo - ye its just text, might add an icon later */}
          <Link href="/" className="flex items-center gap-1 group">
            <span className="text-2xl font-bold text-violet-500 group-hover:text-violet-400 transition-colors">
              ANI
            </span>
            <span className="text-2xl font-bold text-white">HUB</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                {label}
              </Link>
            ))}
            {/* random button gets special treatment */}
            <Link
              href="/random"
              className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all flex items-center gap-1.5"
            >
              <Shuffle className="w-4 h-4" />
              Random
            </Link>
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden sm:flex items-center">
            <div
              className={clsx(
                "relative transition-all duration-300",
                isSearchFocused ? "w-72" : "w-56"
              )}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search anime..."
                className="w-full px-4 py-2 pl-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </form>

          {/* Right side actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* notification bell - TODO: actually implement notifications lol */}
            <button
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              title="Notifications (coming soon)"
            >
              <Bell className="w-5 h-5" />
            </button>

            {/* auth section */}
            {loading ? (
              // skeleton loader
              <div className="w-10 h-10 bg-gray-700/50 rounded-xl animate-pulse" />
            ) : isAuthenticated && user ? (
              // logged in - show profile dropdown
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                >
                  <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-sm font-bold text-white">
                    {getUserInitial()}
                  </div>
                  <span className="text-sm text-gray-300 max-w-[100px] truncate">
                    {user.displayName || user.username}
                  </span>
                  <ChevronDown
                    className={clsx(
                      "w-4 h-4 text-gray-400 transition-transform",
                      isProfileOpen && "rotate-180"
                    )}
                  />
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50">
                    {/* user info header */}
                    <div className="px-4 py-3 border-b border-gray-800">
                      <p className="text-sm font-medium text-white">
                        {user.displayName || user.username}
                      </p>
                      <p className="text-xs text-gray-400">@{user.username}</p>
                    </div>

                    {/* menu items */}
                    <div className="py-2">
                      <ProfileMenuItem href="/profile" icon={User} onClick={() => setIsProfileOpen(false)}>
                        Profile
                      </ProfileMenuItem>
                      <ProfileMenuItem href="/profile/favorites" icon={Heart} onClick={() => setIsProfileOpen(false)}>
                        Favorites
                      </ProfileMenuItem>
                      <ProfileMenuItem href="/profile/watchlist" icon={ClipboardList} onClick={() => setIsProfileOpen(false)}>
                        Watchlist
                      </ProfileMenuItem>
                      <ProfileMenuItem href="/profile/history" icon={Clock} onClick={() => setIsProfileOpen(false)}>
                        History
                      </ProfileMenuItem>
                      <ProfileMenuItem href="/profile/settings" icon={Settings} onClick={() => setIsProfileOpen(false)}>
                        Settings
                      </ProfileMenuItem>
                    </div>

                    {/* logout */}
                    <div className="py-2 border-t border-gray-800">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 w-full text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <LogOut className="w-5 h-5" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // not logged in
              <Link
                href="/login"
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-all hover:scale-105"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* mobile nav removed - using bottom nav bar instead (MobileNav component) */}
        {/* keeping the hamburger for search on mobile tho */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/5">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search anime..."
                  className="w-full px-4 py-3 pl-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
            </form>
            {/* quick links for mobile */}
            <div className="flex flex-col gap-1">
              <Link
                href="/random"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <Shuffle className="w-5 h-5" />
                Random Anime
              </Link>
            </div>
            {/* login btn for mobile */}
            {!isAuthenticated && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white text-center font-medium rounded-xl transition-all"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

// extracted to reduce repetition in dropdown
// probably overkill for this use case but whatever
interface ProfileMenuItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick?: () => void;
}

function ProfileMenuItem({ href, icon: Icon, children, onClick }: ProfileMenuItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-white/5 hover:text-white transition-all"
    >
      <Icon className="w-5 h-5" />
      {children}
    </Link>
  );
}
