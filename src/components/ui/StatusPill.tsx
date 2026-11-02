import { cn } from '@/lib/utils';

interface StatusPillProps {
  label: string;
  variant: 'pending' | 'done' | 'owe' | 'get' | 'info';
}

const pillStyles = {
  pending: 'bg-[#FFD23F] text-[#111]',
  done: 'bg-[#3DDC97] text-[#111]',
  owe: 'bg-[#FF3B3B] text-white',
  get: 'bg-[#3DDC97] text-[#111]',
  info: 'bg-[#6EC6FF] text-[#111]',
};

export function StatusPill({ label, variant }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border-[2px] border-[#111]',
        pillStyles[variant]
      )}
    >
      {label}
    </span>
  );
}
