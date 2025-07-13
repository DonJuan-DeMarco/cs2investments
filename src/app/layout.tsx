import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { AuthProvider } from "@/contexts/auth-context"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CS2 Investments - Item Tracker",
  description: "Track your CS2 items, float values, and market data",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' }
    ],
    apple: { url: '/apple-touch-icon.svg', type: 'image/svg+xml', sizes: '180x180' }
  },
  // manifest: '/manifest.json',
  themeColor: '#2D4A96'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <AuthProvider>
          <Navbar />
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
          <SpeedInsights />
        </AuthProvider>
      </body>
    </html>
  );
}
