import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="text-8xl font-bold text-violet-500 mb-4">404</div>
        <h2 className="text-2xl font-semibold text-white mb-4">
          Anime Not Found
        </h2>
        <p className="text-gray-400 mb-6">
          Sorry, we couldn't find this anime in our database
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
