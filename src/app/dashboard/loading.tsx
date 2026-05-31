export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-pulse">
      <div className="h-8 w-32 bg-zinc-800 rounded mb-6" />
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="h-24 bg-zinc-800 rounded-xl" />
        <div className="h-24 bg-zinc-800 rounded-xl" />
      </div>
      <div className="h-48 bg-zinc-800 rounded-xl" />
    </div>
  );
}
