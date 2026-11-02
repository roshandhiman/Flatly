import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { StoreProvider } from '@/lib/store';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { FirstRunModal } from '@/components/layout/FirstRunModal';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['500', '700'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Flatly - Shared Living for Students & Young Pros',
  description: 'Shared-living companion app for roommates in India. Split expenses, manage chores, and find rooms.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-[#F0EBE1] flex justify-center items-start md:p-6 lg:p-8">
        <StoreProvider>
          {/* Responsive Shell: Native phone on mobile (<md), elegant wide dashboard on tablets & laptops (md+) */}
          <div className="w-full md:max-w-5xl lg:max-w-6xl xl:max-w-7xl min-h-screen md:min-h-[calc(100vh-4rem)] bg-[#FFF8EC] md:border-[3.5px] border-[#111] md:rounded-[32px] md:shadow-[12px_12px_0_#111] flex flex-col overflow-hidden relative transition-all duration-200">
            <Suspense fallback={<div className="h-16 bg-[#FFF8EC] border-b-[2.5px] border-[#111]" />}>
              <AppHeader />
            </Suspense>
            <main className="flex-1 overflow-y-auto pb-24 md:pb-10">
              {children}
            </main>
            <Suspense fallback={<div className="h-14 bg-[#FFF8EC] border-t-[2.5px] border-[#111] md:hidden" />}>
              <BottomTabBar />
            </Suspense>
            <FirstRunModal />
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
