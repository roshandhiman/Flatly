'use client';

import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-bold text-[#111] mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-2.5 rounded-[12px] border-[2.5px] border-[#111] bg-white text-[#111] placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-[#FFD23F] focus:ring-offset-1',
            'shadow-[4px_4px_0_#111] focus:shadow-[2px_2px_0_#111] focus:translate-x-[2px] focus:translate-y-[2px] transition-all duration-100',
            error && 'border-[#FF3B3B] shadow-[4px_4px_0_#FF3B3B]',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm font-bold text-[#FF3B3B]">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
