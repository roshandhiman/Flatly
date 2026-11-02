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
      <body className="min-h-screen bg-[#F0EBE1] flex justify-center items-start sm:py-6">
        <StoreProvider>
          {/* 430px Phone Container */}
          <div className="w-full sm:max-w-[430px] min-h-screen sm:min-h-[860px] sm:max-h-[920px] bg-[#FFF8EC] sm:border-[3px] border-[#111] sm:rounded-[32px] sm:shadow-[8px_8px_0_#111] flex flex-col overflow-hidden relative">
            <Suspense fallback={<div className="h-14 bg-[#FFF8EC] border-b-[2.5px] border-[#111]" />}>
              <AppHeader />
            </Suspense>
            <main className="flex-1 overflow-y-auto pb-6">
              {children}
            </main>
            <Suspense fallback={<div className="h-14 bg-[#FFF8EC] border-t-[2.5px] border-[#111]" />}>
              <BottomTabBar />
            </Suspense>
            <FirstRunModal />
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
