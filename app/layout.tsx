import type { Metadata, Viewport } from 'next';
import { B612, B612_Mono } from 'next/font/google';
import { AmbientProvider } from '@/components/AmbientProvider';
import './globals.css';

const b612 = B612({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-b612',
});

const b612Mono = B612_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-b612-mono',
});

export const metadata: Metadata = {
  title: 'SkyStalker — Real-time Aircraft Tracking',
  description: 'Spot every plane above you. Real-time ADS-B tracking with push notifications.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${b612.variable} ${b612Mono.variable} h-full antialiased`}>
      <body className="flex h-full flex-col bg-[var(--fids-bg)] font-sans text-slate-100"><AmbientProvider>{children}</AmbientProvider></body>
    </html>
  );
}
