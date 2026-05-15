import WaiverBuilder from "@/components/WaiverBuilder";

export default function NewWaiverPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">New waiver</h1>
      <WaiverBuilder />
    </div>
  );
}
