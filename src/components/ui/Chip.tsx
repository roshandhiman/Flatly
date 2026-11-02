'use client';

import { cn } from '@/lib/utils';

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'filter';
}

export function Chip({ label, selected, onClick, variant = 'default' }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-[12px] border-[2.5px] border-[#111] text-sm font-bold transition-all duration-100 cursor-pointer',
        selected
          ? 'bg-[#FFD23F] shadow-[2px_2px_0_#111] text-[#111]'
          : 'bg-white shadow-[3px_3px_0_#111] text-[#111] hover:bg-gray-50',
        variant === 'filter' && selected && 'bg-[#111] text-white',
      )}
    >
      {label}
    </button>
  );
}
