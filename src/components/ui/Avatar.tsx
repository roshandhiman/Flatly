import { getInitials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  color: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const sizeMap = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
};

export function Avatar({ name, color, size = 'md' }: AvatarProps) {
  return (
    <div
      className={`${sizeMap[size]} rounded-full border-[2px] border-[#111] flex items-center justify-center font-bold text-[#111] flex-shrink-0`}
      style={{ backgroundColor: color }}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
