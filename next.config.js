/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Разрешаем загрузку изображений с внешних источников
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.myanimelist.net',
      },
      {
        protocol: 'https',
        hostname: 'img1.ak.crunchyroll.com',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      // AniList CDN
      {
        protocol: 'https',
        hostname: 's4.anilist.co',
      },
      {
        protocol: 'https',
        hostname: 'anilist.co',
      },
      // Kitsu CDN
      {
        protocol: 'https',
        hostname: 'media.kitsu.io',
      },
      {
        protocol: 'https',
        hostname: 'media.kitsu.app',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Оптимизация
  swcMinify: true,

  // Переменные окружения для клиента
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
}

module.exports = nextConfig
