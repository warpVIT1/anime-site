export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header placeholder */}
      <div className="sticky top-0 z-50 bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="w-24 h-8 bg-gray-800 rounded animate-pulse" />
            <div className="hidden md:flex gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-16 h-8 bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
            <div className="w-56 h-10 bg-gray-800 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <div className="w-48 h-10 bg-gray-800 rounded animate-pulse mb-2" />
          <div className="w-64 h-5 bg-gray-800 rounded animate-pulse" />
        </div>

        {/* Search bar */}
        <div className="mb-8">
          <div className="w-full h-12 bg-gray-800 rounded-xl animate-pulse" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-3/4 bg-gray-800 rounded-xl mb-3" />
              <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
