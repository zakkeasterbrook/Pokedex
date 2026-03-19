import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pokedex-mu-eight.vercel.app"),
  title: {
    default: "Pokédex Card Scanner",
    template: "%s | Pokédex Card Scanner",
  },
  description:
    "A premium digital collection app for scanning, tracking, and managing physical trading cards with front/back scans, condition tracking, and grading details.",
  applicationName: "Pokédex Card Scanner",
  keywords: [
    "Pokemon",
    "Pokedex",
    "card scanner",
    "card collection",
    "Bandai Carddass",
    "grading tracker",
    "trading cards",
    "collector app",
  ],
  authors: [{ name: "Zakk Easterbrook" }],
  creator: "Zakk Easterbrook",
  publisher: "Zakk Easterbrook",
  openGraph: {
    title: "Pokédex Card Scanner",
    description:
      "Scan, collect, and manage physical trading cards with a premium digital collector experience.",
    url: "https://pokedex-mu-eight.vercel.app",
    siteName: "Pokédex Card Scanner",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pokédex Card Scanner",
    description:
      "Scan, collect, and manage physical trading cards with a premium digital collector experience.",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-black text-white font-sans">
        <div className="min-h-screen flex flex-col bg-black text-white">
          {children}
        </div>
      </body>
    </html>
  );
}