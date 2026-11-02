import { Button } from './Button';

interface EmptyStateProps {
  emoji: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="text-5xl mb-4">{emoji}</div>
      <h3 className="text-lg font-bold text-[#111] mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-[250px]">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
