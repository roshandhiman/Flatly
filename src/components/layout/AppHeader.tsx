'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home as HomeIcon, ArrowLeft, Search, Zap, User, Building2 } from 'lucide-react';
import { useStore } from '@/lib/store';

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { flat, profile } = useStore();
  // Guard against hydration mismatch: profile comes from localStorage, only available client-side
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isSubpage = pathname.split('/').filter(Boolean).length > 1;
  const isFindMode = pathname.startsWith('/find');
  const isLiveMode = pathname.startsWith('/live');

  const navLinks = [
    { name: 'Home', href: '/', icon: HomeIcon, active: pathname === '/' },
    { name: 'Find Rooms', href: '/find', icon: Search, active: pathname.startsWith('/find') },
    { name: 'Live Flat', href: '/live', icon: Zap, active: pathname.startsWith('/live') },
    { name: 'Profile', href: '/profile', icon: User, active: pathname.startsWith('/profile') },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FFF8EC] border-b-[2.5px] border-[#111] px-4 md:px-8 py-3.5 flex items-center justify-between">
      {/* Brand & Left controls */}
      <div className="flex items-center gap-3">
        {isSubpage ? (
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-[10px] border-[2px] border-[#111] bg-white shadow-[2px_2px_0_#111] flex items-center justify-center hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
        ) : (
          <Link
            href="/"
            className="w-9 h-9 md:w-10 md:h-10 rounded-[12px] border-[2.5px] border-[#111] bg-[#FFD23F] shadow-[2.5px_2.5px_0_#111] flex items-center justify-center hover:bg-[#ffe17d] transition-all"
          >
            <HomeIcon size={20} strokeWidth={2.5} />
          </Link>
        )}

        <Link href="/" className="flex items-baseline gap-2 group">
          <span className="font-heading text-2xl md:text-2xl font-black tracking-tight text-[#111] group-hover:text-black">
            Flatly
          </span>
          <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FF6B6B] text-white border-[1.5px] border-[#111] shadow-[1px_1px_0_#111]">
            LIVE & FIND
          </span>
        </Link>
      </div>

      {/* Desktop Navigation Links (Tablets & Laptops) */}
      <nav className="hidden md:flex items-center gap-1.5 lg:gap-2 bg-white/70 backdrop-blur-xs p-1.5 border-[2px] border-[#111] rounded-[16px] shadow-[3px_3px_0_#111]">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] font-heading text-xs font-black transition-all ${
                item.active
                  ? 'bg-[#FFD23F] text-[#111] border-[1.5px] border-[#111] shadow-[2px_2px_0_#111] -translate-y-0.5'
                  : 'text-gray-600 hover:text-[#111] hover:bg-black/5'
              }`}
            >
              <Icon size={14} strokeWidth={item.active ? 2.5 : 2} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right controls: Flat pill & Mode toggle */}
      <div className="flex items-center gap-2.5">
        {/* Flat info pill on tablet/laptop — client-side only */}
        {mounted && flat ? (
          <Link
            href="/live"
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1 bg-white border-[2px] border-[#111] rounded-full shadow-[2px_2px_0_#111] text-xs font-bold hover:bg-[#FFD23F] transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-[#3DDC97] animate-pulse" />
            <span className="font-bold text-[#111] truncate max-w-[140px]">{flat.name}</span>
          </Link>
        ) : (
          <Link
            href="/live"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFD23F] border-[2px] border-[#111] rounded-full shadow-[2px_2px_0_#111] text-xs font-black hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            <Building2 size={13} strokeWidth={2.5} />
            <span>Setup Flat</span>
          </Link>
        )}

        {/* Mode switch pills */}
        <div className="flex items-center gap-1 bg-white border-[2px] border-[#111] rounded-full p-1 shadow-[2px_2px_0_#111] text-xs font-bold">
          <Link
            href="/find"
            className={`px-3 py-1 rounded-full transition-all ${
              isFindMode
                ? 'bg-[#FFD23F] text-[#111] shadow-[1px_1px_0_#111] font-black'
                : 'text-gray-600 hover:text-black font-bold'
            }`}
          >
            Find
          </Link>
          <span className="text-gray-300">/</span>
          <Link
            href="/live"
            className={`px-3 py-1 rounded-full transition-all ${
              isLiveMode
                ? 'bg-[#FFD23F] text-[#111] shadow-[1px_1px_0_#111] font-black'
                : 'text-gray-600 hover:text-black font-bold'
            }`}
          >
            Live
          </Link>
        </div>

        {/* Profile Avatar on Desktop — rendered client-side only to avoid hydration mismatch */}
        <Link
          href="/profile"
          className="hidden md:flex w-9 h-9 rounded-full bg-[#111] text-[#FFD23F] font-black text-xs items-center justify-center border-[2px] border-[#111] shadow-[2px_2px_0_#111] hover:scale-105 transition-transform"
          title="My Profile"
          suppressHydrationWarning
        >
          <span suppressHydrationWarning>
            {mounted && profile?.name ? profile.name.slice(0, 2).toUpperCase() : 'ME'}
          </span>
        </Link>
      </div>
    </header>
  );
}
