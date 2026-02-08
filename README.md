# Anime Discovery Platform

A modern web application for discovering and tracking anime series.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4
- **Database:** Prisma with SQLite
- **Authentication:** JWT with bcrypt

## Features

- Browse anime catalog with advanced filtering
- Episode release schedule tracker
- User rating system
- Multi-source API integration (Jikan, AniList, Kitsu)
- Dark/Light theme support
- Responsive design

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/           # Next.js pages and routes
├── components/    # React components
├── lib/           # Utilities and API clients
├── contexts/      # React contexts
├── config/        # Configuration files
└── types/         # TypeScript interfaces
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript check

## Known Issues

### Video Player Not Working
The embedded video player currently does not work properly. I spent 3 days trying to configure various embed providers (2embed, VidSrc, AutoEmbed) but couldn't get them to function correctly due to:
- CORS blocking
- 403 Forbidden responses
- Embeds not loading

**Workaround:** The player shows external links to streaming sites (HiAnime, AniWave, etc.) as a fallback.

If you know how to fix this, contributions are welcome!

## License

MIT
