/**
 * Site footer
 * @author warpVIT
 *
 * kept it simple, just links and socials
 * the konami code easter egg is in here too ;)
 */

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Github, Twitter, MessageCircle, Coffee, Heart } from 'lucide-react';

// quick links config
const QUICK_LINKS = [
  { href: '/catalog', label: 'Browse Anime' },
  { href: '/schedule', label: 'Release Schedule' },
  { href: '/top', label: 'Top Rated' },
  { href: '/random', label: 'Random Anime' },
] as const;

const SUPPORT_LINKS = [
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
] as const;

// discord icon - lucide doesnt have it
const DiscordIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

// telegram icon
const TelegramIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.504-1.36 8.629-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

export default function Footer() {
  const [clickCount, setClickCount] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  // easter egg: click the logo 7 times
  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 7) {
      setShowEasterEgg(true);
      setClickCount(0);
      // hide after 3 seconds
      setTimeout(() => setShowEasterEgg(false), 3000);
    }
  };

  // konami code easter egg
  useEffect(() => {
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          // konami code entered!
          document.body.style.transition = 'filter 0.5s';
          document.body.style.filter = 'hue-rotate(180deg)';
          setTimeout(() => {
            document.body.style.filter = '';
          }, 3000);
          konamiIndex = 0;
        }
      } else {
        konamiIndex = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <footer className="border-t border-white/5 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">

          {/* Logo & Description */}
          <div className="sm:col-span-2 text-center sm:text-left">
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-1 mb-4 justify-center sm:justify-start group"
            >
              <span className="text-xl sm:text-2xl font-bold text-violet-500 group-hover:text-violet-400 transition-colors">
                ANI
              </span>
              <span className="text-xl sm:text-2xl font-bold text-white">HUB</span>
            </button>

            {showEasterEgg && (
              <p className="text-violet-400 text-sm mb-4 animate-pulse">
                you found me! - warpVIT
              </p>
            )}

            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-md mb-4 sm:mb-6">
              Your go-to place for anime. Discover new shows, track your watchlist,
              and join a community of fellow weebs.
            </p>

            {/* Social Links */}
            <div className="flex gap-3 justify-center sm:justify-start">
              <SocialLink href="#" label="Discord" icon={<DiscordIcon />} />
              <SocialLink href="#" label="Twitter" icon={<Twitter className="w-5 h-5" />} />
              <SocialLink href="#" label="Telegram" icon={<TelegramIcon />} />
              <SocialLink href="https://github.com/warpVIT" label="GitHub" icon={<Github className="w-5 h-5" />} />
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center sm:text-left">
            <h4 className="text-white font-semibold mb-4 text-sm sm:text-base">Quick Links</h4>
            <ul className="space-y-2 sm:space-y-3">
              {QUICK_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-gray-400 hover:text-violet-400 text-xs sm:text-sm transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="text-center sm:text-left">
            <h4 className="text-white font-semibold mb-4 text-sm sm:text-base">Support</h4>
            <ul className="space-y-2 sm:space-y-3">
              {SUPPORT_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-gray-400 hover:text-violet-400 text-xs sm:text-sm transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm text-center sm:text-left flex items-center gap-1">
            © 2026 ANIHUB. Made with
            <Heart className="w-4 h-4 text-red-500 fill-current inline" />
            and
            <Coffee className="w-4 h-4 text-amber-600 inline" />
            by warpVIT
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Powered by</span>
            <a
              href="https://jikan.moe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              Jikan API
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// social link component - extracted for cleaner code
interface SocialLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function SocialLink({ href, label, icon }: SocialLinkProps) {
  return (
    <a
      href={href}
      className="w-10 h-10 bg-white/5 hover:bg-violet-600 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all hover:scale-110"
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
    >
      {icon}
    </a>
  );
}
