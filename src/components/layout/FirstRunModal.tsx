'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sparkles } from 'lucide-react';

export function FirstRunModal() {
  const { profile, setProfile, isHydrated } = useStore();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  if (!isHydrated || profile?.name) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Arrey! Please enter your name');
      return;
    }

    setProfile({
      name: name.trim(),
      habits: {
        sleepTime: 'Midnight (12 AM - 2 AM)',
        cleanliness: 'Regular tidy up',
        guests: 'Weekends only',
        foodPreference: 'No preference',
        smoking: 'Non-smoker',
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-[380px] bg-[#FFF8EC] rounded-[16px] border-[3px] border-[#111] shadow-[6px_6px_0_#111] p-6 animate-slide-up">
        <div className="w-12 h-12 bg-[#FFD23F] border-[2px] border-[#111] shadow-[3px_3px_0_#111] rounded-[12px] flex items-center justify-center text-2xl mb-4">
          👋
        </div>
        
        <h2 className="font-heading text-2xl font-black text-[#111] mb-1">
          Welcome to Flatly!
        </h2>
        <p className="text-sm font-medium text-gray-700 mb-5">
          Shared living made easy. Aapka shubh naam kya hai?
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Your Name"
            placeholder="e.g. Rahul Sharma"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            error={error}
            autoFocus
          />

          <Button type="submit" fullWidth size="lg">
            <span>Let&apos;s get started</span>
            <Sparkles size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
}

