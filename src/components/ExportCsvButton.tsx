"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export default function ExportCsvButton() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch("/api/export-guests");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename="(.+?)"/);
      a.download = match ? match[1] : "wavr-guests.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Could not export guests. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-wavr-blue hover:bg-wavr-blue-dark disabled:opacity-50 text-white text-sm font-semibold transition-colors"
    >
      <Download size={15} />
      {loading ? "Exporting…" : "Export CSV"}
    </button>
  );
}
