'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'relative w-full max-w-[430px] bg-[#FFF8EC] rounded-t-[20px] border-t-[2.5px] border-x-[2.5px] border-[#111]',
          'max-h-[85vh] overflow-y-auto',
          'animate-slide-up'
        )}
      >
        <div className="sticky top-0 bg-[#FFF8EC] flex items-center justify-between p-4 border-b-[2px] border-[#111]">
          <h2 className="text-lg font-bold text-[#111]">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border-[2px] border-[#111] flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
