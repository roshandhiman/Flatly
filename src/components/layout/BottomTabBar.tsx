'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Zap, User } from 'lucide-react';

interface TabItem {
  name: string;
  href: string;
  icon: typeof Home;
}

const TABS: TabItem[] = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Find', href: '/find', icon: Search },
  { name: 'Live', href: '/live', icon: Zap },
  { name: 'Profile', href: '/profile', icon: User },
];

export function BottomTabBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="sticky bottom-0 z-40 bg-[#FFF8EC] border-t-[2.5px] border-[#111] px-3 py-2">
      <div className="flex items-center justify-around gap-1">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-[12px] border-[2px] transition-all cursor-pointer ${
                active
                  ? 'bg-[#FFD23F] border-[#111] shadow-[3px_3px_0_#111] -translate-y-0.5'
                  : 'bg-transparent border-transparent text-gray-500 hover:text-[#111]'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} className="text-[#111]" />
              <span className={`text-[11px] font-bold mt-0.5 ${active ? 'text-[#111]' : 'text-gray-600'}`}>
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

