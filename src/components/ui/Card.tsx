import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'yellow' | 'coral' | 'mint' | 'flat';
}

const bgStyles = {
  default: 'bg-white',
  yellow: 'bg-[#FFD23F]',
  coral: 'bg-[#FF6B57]',
  mint: 'bg-[#3DDC97]',
  flat: 'bg-white shadow-none border-0',
};

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[12px] border-[2.5px] border-[#111] shadow-[4px_4px_0_#111] p-4',
        bgStyles[variant],
        variant === 'flat' && 'border-0 shadow-none p-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
