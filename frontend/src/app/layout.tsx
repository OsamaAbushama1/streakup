import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "StreakUp - Level Up Your Creative Skills",
    template: "%s | StreakUp",
  },
  description: "Join StreakUp to level up your creative skills through structured challenges, community support, and gamified learning. Build your portfolio, stay consistent, and grow with the power of practice.",
  keywords: ["creative challenges", "skill development", "portfolio building", "gamified learning", "UI/UX design", "graphic design", "frontend development", "backend development", "coding challenges", "design challenges", "creative portfolio"],
  authors: [{ name: "StreakUp Team" }],
  creator: "StreakUp",
  publisher: "StreakUp",
  applicationName: "StreakUp",
  referrer: "origin-when-cross-origin",
  colorScheme: "light",
  themeColor: "#A333FF",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://streakup-frontend.onrender.com",
    siteName: "StreakUp",
    title: "StreakUp - Level Up Your Creative Skills",
    description: "Join StreakUp to level up your creative skills through structured challenges and community support.",
    images: [
      {
        url: "https://streakup-frontend.onrender.com/imgs/streakupLogo.png",
        width: 1200,
        height: 630,
        alt: "StreakUp - Creative Skills Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StreakUp - Level Up Your Creative Skills",
    description: "Join StreakUp to level up your creative skills through structured challenges and community support.",
    creator: "@streakup",
    images: ["https://streakup-frontend.onrender.com/imgs/streakupLogo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/imgs/streakupLogo.png",
    apple: "/imgs/streakupLogo.png",
  },
  manifest: "/manifest.json",
  category: "education",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
