import type { Metadata } from "next";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "WAVR — Digital Waivers for Adventure Tourism",
  description: "Digital waiver software for adventure tourism operators.",
  manifest: "/manifest.json",
  // Resolved per request from the Host header, so each operator's own logo is used
  // for the browser tab and "Add to Home Screen" — never another client's.
  icons: {
    icon: "/brand/apple-icon",
    shortcut: "/brand/apple-icon",
    apple: "/brand/apple-icon",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WAVR",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-zinc-950 text-white antialiased">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
