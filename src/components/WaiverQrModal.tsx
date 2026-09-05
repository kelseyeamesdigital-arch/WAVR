"use client";

import { useState, useRef } from "react";
import { QrCode, X, Download, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

type Props = { slug: string | null; waiverId: string; title: string };

export default function WaiverQrModal({ slug, waiverId, title }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);

  const signId = slug ?? waiverId;
  const base = typeof window !== "undefined" ? window.location.origin : "https://wavr.app";
  const signUrl = `${base}/sign/${signId}`;

  function copyLink() {
    navigator.clipboard.writeText(signUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadQr() {
    const svg = qrRef.current;
    if (!svg) return;
    const canvas = document.createElement("canvas");
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const a = document.createElement("a");
      a.download = `wavr-qr-${signId}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
        title="Show QR code"
      >
        <QrCode size={14} />
        QR
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white truncate pr-4">{title}</h2>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white transition shrink-0">
                <X size={18} />
              </button>
            </div>

            {/* QR code */}
            <div className="bg-white rounded-xl p-4 flex items-center justify-center mb-4">
              <QRCodeSVG
                ref={qrRef}
                value={signUrl}
                size={220}
                level="M"
                includeMargin={false}
              />
            </div>

            {/* Sign URL */}
            <div className="bg-zinc-800 rounded-lg px-3 py-2 flex items-center gap-2 mb-4">
              <span className="text-xs text-zinc-400 truncate flex-1">{signUrl}</span>
              <button onClick={copyLink} className="shrink-0 text-zinc-400 hover:text-white transition">
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>

            <button
              onClick={downloadQr}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand hover:bg-brand-light text-white text-sm font-semibold transition"
            >
              <Download size={14} />
              Download QR (PNG)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
