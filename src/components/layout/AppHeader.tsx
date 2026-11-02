'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home as HomeIcon, ArrowLeft } from 'lucide-react';
import { useStore } from '@/lib/store';

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { flat } = useStore();

  const isSubpage = pathname.split('/').filter(Boolean).length > 1;
  const isFindMode = pathname.startsWith('/find');
  const isLiveMode = pathname.startsWith('/live');

  return (
    <header className="sticky top-0 z-40 bg-[#FFF8EC] border-b-[2.5px] border-[#111] px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
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
            className="w-9 h-9 rounded-[10px] border-[2.5px] border-[#111] bg-white shadow-[2px_2px_0_#111] flex items-center justify-center hover:bg-[#FFD23F] transition-colors"
          >
            <HomeIcon size={18} strokeWidth={2.5} />
          </Link>
        )}
        <Link href="/" className="flex items-center gap-1.5">
          <span className="font-heading text-xl font-black tracking-tight text-[#111]">
            Flatly
          </span>
        </Link>
      </div>

      {/* Mode toggle / quick indicator */}
      <div className="flex items-center gap-1 bg-white border-[2px] border-[#111] rounded-full p-1 shadow-[2px_2px_0_#111] text-xs font-bold">
        <Link
          href="/find"
          className={`px-3 py-1 rounded-full transition-all ${
            isFindMode ? 'bg-[#FFD23F] text-[#111] shadow-[1px_1px_0_#111]' : 'text-gray-600 hover:text-black'
          }`}
        >
          Find
        </Link>
        <span className="text-gray-300">/</span>
        <Link
          href="/live"
          className={`px-3 py-1 rounded-full transition-all ${
            isLiveMode ? 'bg-[#FFD23F] text-[#111] shadow-[1px_1px_0_#111]' : 'text-gray-600 hover:text-black'
          }`}
        >
          Live
        </Link>
      </div>
    </header>
  );
}

