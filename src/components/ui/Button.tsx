'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'mint';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const variantStyles = {
  primary: 'bg-[#FFD23F] text-[#111] border-[2.5px] border-[#111] shadow-[4px_4px_0_#111] hover:shadow-[2px_2px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
  secondary: 'bg-white text-[#111] border-[2.5px] border-[#111] shadow-[4px_4px_0_#111] hover:shadow-[2px_2px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
  danger: 'bg-[#FF6B57] text-white border-[2.5px] border-[#111] shadow-[4px_4px_0_#111] hover:shadow-[2px_2px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
  ghost: 'bg-transparent text-[#111] border-[2.5px] border-transparent hover:bg-gray-100',
  mint: 'bg-[#3DDC97] text-[#111] border-[2.5px] border-[#111] shadow-[4px_4px_0_#111] hover:shadow-[2px_2px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'font-bold rounded-[12px] transition-all duration-100 cursor-pointer inline-flex items-center justify-center gap-2',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          disabled && 'opacity-50 cursor-not-allowed !shadow-none !translate-x-0 !translate-y-0',
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
