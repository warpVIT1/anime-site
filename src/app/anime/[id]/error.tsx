'use client';

import Link from 'next/link';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="text-6xl mb-4">😵</div>
        <h2 className="text-3xl font-bold text-white mb-4">
          Something went wrong
        </h2>
        <p className="text-gray-400 mb-6">
          Failed to load anime information
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
