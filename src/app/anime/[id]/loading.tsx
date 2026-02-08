export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4 shadow-lg" />
        <p className="text-violet-400 font-semibold tracking-wide">Loading...</p>
      </div>
    </div>
  );
}
