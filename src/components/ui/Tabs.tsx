'use client';

import { cn } from '@/lib/utils';

interface TabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-white rounded-[12px] border-[2.5px] border-[#111] shadow-[4px_4px_0_#111]">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={cn(
            'flex-1 px-4 py-2 rounded-[8px] text-sm font-bold transition-all duration-100 cursor-pointer',
            activeTab === tab
              ? 'bg-[#FFD23F] text-[#111] shadow-[2px_2px_0_#111]'
              : 'text-gray-500 hover:text-[#111]'
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
