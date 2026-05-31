export default function GuestsLoading() {
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto animate-pulse space-y-2">
      <div className="h-8 w-24 bg-zinc-800 rounded mb-4" />
      <div className="h-10 bg-zinc-800 rounded-lg" />
      <div className="h-10 bg-zinc-800 rounded-lg" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-14 bg-zinc-800 rounded-xl" />
      ))}
    </div>
  );
}
