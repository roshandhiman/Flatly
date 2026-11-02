'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
import { Check, RotateCcw, Save, Sparkles, User } from 'lucide-react';

const SLEEP_OPTIONS = [
  'Early bird (Before 11 PM)',
  'Moderate (11 PM - 1 AM)',
  'Night owl (Late nights)',
];

const CLEANLINESS_OPTIONS = [
  'Super tidy & organized',
  'Regular tidy up',
  'Chill / flexible',
];

const GUESTS_OPTIONS = [
  'Strictly no guests',
  'Weekends only',
  'Friends welcome anytime',
];

const FOOD_OPTIONS = [
  'Pure Vegetarian',
  'Non-Veg friendly',
  'Eggetarian',
  'No cooking at home',
];

const SMOKING_OPTIONS = [
  'Strict Non-smoker',
  'Balcony only',
  'Social smoker',
];

export default function ProfilePage() {
  const { profile, setProfile, flat } = useStore();
  const [name, setName] = useState('');
  const [sleepTime, setSleepTime] = useState('');
  const [cleanliness, setCleanliness] = useState('');
  const [guests, setGuests] = useState('');
  const [foodPreference, setFoodPreference] = useState('');
  const [smoking, setSmoking] = useState('');
  const [savedToast, setSavedToast] = useState(false);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setSleepTime(profile.habits?.sleepTime || SLEEP_OPTIONS[1]);
      setCleanliness(profile.habits?.cleanliness || CLEANLINESS_OPTIONS[1]);
      setGuests(profile.habits?.guests || GUESTS_OPTIONS[1]);
      setFoodPreference(profile.habits?.foodPreference || FOOD_OPTIONS[1]);
      setSmoking(profile.habits?.smoking || SMOKING_OPTIONS[0]);
    } else {
      setSleepTime(SLEEP_OPTIONS[1]);
      setCleanliness(CLEANLINESS_OPTIONS[1]);
      setGuests(GUESTS_OPTIONS[1]);
      setFoodPreference(FOOD_OPTIONS[1]);
      setSmoking(SMOKING_OPTIONS[0]);
    }
  }, [profile]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Please enter your name');
      return;
    }

    setProfile({
      name: name.trim(),
      habits: {
        sleepTime,
        cleanliness,
        guests,
        foodPreference,
        smoking,
      },
    });

    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all local data? This will clear flat, expenses, and listings.')) {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        window.location.href = '/';
      }
    }
  };

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-black text-[#111]">
            Profile & Habits
          </h1>
          <p className="text-xs font-semibold text-gray-500">
            Tell roommates how you like to live
          </p>
        </div>

        <div className="w-10 h-10 rounded-full bg-[#FFD23F] border-[2.5px] border-[#111] shadow-[2px_2px_0_#111] flex items-center justify-center font-black text-sm">
          {name ? name.slice(0, 2).toUpperCase() : 'ME'}
        </div>
      </div>

      {savedToast && (
        <div className="p-3 bg-[#3DDC97] border-[2.5px] border-[#111] rounded-[12px] shadow-[3px_3px_0_#111] flex items-center gap-2 text-sm font-bold text-[#111] animate-slide-up">
          <Check size={18} strokeWidth={3} />
          <span>Profile saved locally! Mast kaam.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Supabase Auth Banner */}
        <Link
          href="/login"
          className="flex items-center justify-between p-3.5 bg-[#FFD23F] border-[2.5px] border-[#111] rounded-[16px] shadow-[4px_4px_0_#111] hover:shadow-[2px_2px_0_#111] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🔐</span>
            <div>
              <div className="font-heading font-black text-sm text-[#111]">
                Login / Supabase Account
              </div>
              <div className="text-[11px] font-bold text-gray-800">
                Sign in with Phone OTP, Email, or Google
              </div>
            </div>
          </div>
          <span className="text-xs font-black px-2.5 py-1 bg-white border-[1.5px] border-[#111] rounded-[8px]">
            Open &rarr;
          </span>
        </Link>

        {/* Basic Details */}
        <Card className="bg-white space-y-3">
          <h2 className="font-heading font-black text-sm text-[#111] uppercase tracking-wide">
            Personal Info
          </h2>

          <Input
            label="Your Display Name"
            placeholder="e.g. Rahul Sharma"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError('');
            }}
            error={nameError}
          />

          {flat && (
            <div className="p-2.5 bg-yellow-50 border-[2px] border-[#111] rounded-[10px] text-xs font-bold flex items-center justify-between">
              <span className="text-gray-700">Current Flat:</span>
              <span className="text-[#111] font-black">{flat.name} ({flat.members.length} members)</span>
            </div>
          )}
        </Card>

        {/* Habits Section */}
        <Card className="bg-white space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#FFD23F]" />
            <h2 className="font-heading font-black text-sm text-[#111] uppercase tracking-wide">
              Living Habits & Preferences
            </h2>
          </div>

          {/* Sleep schedule */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700">
              🌙 Sleep Schedule
            </label>
            <div className="flex flex-wrap gap-2">
              {SLEEP_OPTIONS.map((opt) => (
                <Chip
                  key={opt}
                  label={opt}
                  selected={sleepTime === opt}
                  onClick={() => setSleepTime(opt)}
                />
              ))}
            </div>
          </div>

          {/* Cleanliness */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700">
              🧹 Cleanliness & Tidiness
            </label>
            <div className="flex flex-wrap gap-2">
              {CLEANLINESS_OPTIONS.map((opt) => (
                <Chip
                  key={opt}
                  label={opt}
                  selected={cleanliness === opt}
                  onClick={() => setCleanliness(opt)}
                />
              ))}
            </div>
          </div>

          {/* Guests */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700">
              👥 Guest Policy
            </label>
            <div className="flex flex-wrap gap-2">
              {GUESTS_OPTIONS.map((opt) => (
                <Chip
                  key={opt}
                  label={opt}
                  selected={guests === opt}
                  onClick={() => setGuests(opt)}
                />
              ))}
            </div>
          </div>

          {/* Food */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700">
              🍲 Food Preference
            </label>
            <div className="flex flex-wrap gap-2">
              {FOOD_OPTIONS.map((opt) => (
                <Chip
                  key={opt}
                  label={opt}
                  selected={foodPreference === opt}
                  onClick={() => setFoodPreference(opt)}
                />
              ))}
            </div>
          </div>

          {/* Smoking */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700">
              🚭 Smoking & Lifestyle
            </label>
            <div className="flex flex-wrap gap-2">
              {SMOKING_OPTIONS.map((opt) => (
                <Chip
                  key={opt}
                  label={opt}
                  selected={smoking === opt}
                  onClick={() => setSmoking(opt)}
                />
              ))}
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <Button type="submit" variant="primary" fullWidth size="lg">
          <Save size={18} />
          <span>Save Changes</span>
        </Button>
      </form>

      {/* Danger Zone: Clear all local storage */}
      <div className="pt-4 border-t-[2px] border-dashed border-gray-300 text-center">
        <button
          type="button"
          onClick={handleResetData}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-800 transition-colors cursor-pointer"
        >
          <RotateCcw size={14} />
          <span>Reset All Local Data (Testing)</span>
        </button>
      </div>
    </div>
  );
}

