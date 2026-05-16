import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adventure Rafting Bled — Guest Waivers",
  description: "Digital waivers for Adventure Rafting Bled guests.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-zinc-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
