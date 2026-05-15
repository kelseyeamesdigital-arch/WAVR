import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WAVR — Digital Waivers for Adventure Operators",
  description: "Fast, simple digital waivers for tour and activity operators.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geist.className} min-h-full bg-zinc-950 text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
