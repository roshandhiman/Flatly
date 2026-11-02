'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
import { Check, RotateCcw, Save, Sparkles, LogOut, LogIn, Mail, Phone } from 'lucide-react';

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
  const { user, signOut } = useAuth();
  const router = useRouter();
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

  const handleLogout = async () => {
    if (confirm('Logout karna chahte ho?')) {
      await signOut();
      if (typeof window !== 'undefined') localStorage.clear();
      router.push('/login');
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-black text-[#111]">
            Profile & Habits 👤
          </h1>
          <p className="text-xs md:text-sm font-semibold text-gray-500 mt-0.5">
            Set your living habits so roommate matching can calculate compatibility accurately
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FF3B3B] border-[2px] border-[#111] rounded-full shadow-[2px_2px_0_#111] text-xs font-black text-white hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          ) : (
            <a
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFD23F] border-[2px] border-[#111] rounded-full shadow-[2px_2px_0_#111] text-xs font-black hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              <LogIn size={14} />
              <span>Login / Account</span>
            </a>
          )}
        </div>
      </div>

      {savedToast && (
        <div className="p-3.5 bg-[#3DDC97] border-[2.5px] border-[#111] rounded-[16px] shadow-[4px_4px_0_#111] flex items-center gap-2 text-sm font-black text-[#111] animate-slide-up">
          <Check size={20} strokeWidth={3} />
          <span>Profile saved locally! Mast kaam.</span>
        </div>
      )}

      {/* Responsive 2-Col Layout on Tablet & Desktop */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Section: User Card & Habits Persona (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Supabase Auth Banner */}
          {user ? (
            <div className="flex items-center justify-between p-4 bg-[#3DDC97] border-[2.5px] border-[#111] rounded-[20px] shadow-[5px_5px_0_#111]">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <div className="font-heading font-black text-sm md:text-base text-[#111]">
                    Logged In
                  </div>
                  <div className="text-xs font-bold text-gray-800 truncate max-w-[180px]">
                    {user.email || user.phone || 'Authenticated User'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-black px-3 py-1 bg-white border-[1.5px] border-[#111] rounded-[10px] cursor-pointer hover:bg-red-50 transition-colors"
              >
                Logout →
              </button>
            </div>
          ) : (
            <a
              href="/login"
              className="flex items-center justify-between p-4 bg-[#FFD23F] border-[2.5px] border-[#111] rounded-[20px] shadow-[5px_5px_0_#111] hover:shadow-[2px_2px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all block"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔐</span>
                <div>
                  <div className="font-heading font-black text-sm md:text-base text-[#111]">
                    Login / Cloud Account
                  </div>
                  <div className="text-xs font-bold text-gray-800">
                    Sign in with Phone OTP, Email, or Google
                  </div>
                </div>
              </div>
              <span className="text-xs font-black px-3 py-1 bg-white border-[1.5px] border-[#111] rounded-[10px]">
                Open &rarr;
              </span>
            </a>
          )}

          {/* Identity Card */}
          <div className="p-6 bg-white border-[2.5px] border-[#111] rounded-[24px] shadow-[6px_6px_0_#111] space-y-4 text-center">
            <div className="w-20 h-20 rounded-full bg-[#FFD23F] border-[3px] border-[#111] shadow-[4px_4px_0_#111] flex items-center justify-center font-heading font-black text-2xl text-[#111] mx-auto">
              {name ? name.slice(0, 2).toUpperCase() : 'ME'}
            </div>

            <div>
              <h2 className="font-heading font-black text-xl md:text-2xl text-[#111]">
                {name || 'Your Name'}
              </h2>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">
                Roommate Seeker & Co-liver
              </p>
            </div>

            {flat && (
              <div className="p-3 bg-[#FFF8EC] border-[2px] border-[#111] rounded-[14px] text-xs font-bold flex items-center justify-between text-left">
                <span className="text-gray-600">Active Flat:</span>
                <span className="text-[#111] font-black">{flat.name} ({flat.members.length} members)</span>
              </div>
            )}
          </div>

          {/* Living Persona Highlights */}
          <div className="p-6 bg-[#6EC6FF]/20 border-[2.5px] border-[#111] rounded-[24px] shadow-[6px_6px_0_#111] space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b-[2px] border-[#111]">
              <Sparkles size={18} />
              <h3 className="font-heading font-black text-sm md:text-base text-[#111]">
                Your Compatibility Blueprint
              </h3>
            </div>

            <p className="text-xs text-gray-700 font-medium leading-relaxed">
              These factors are used by Flatly&apos;s deterministic algorithm to score compatibility (0–100) with dealbreaker protection:
            </p>

            <div className="space-y-2 text-xs font-bold text-[#111]">
              <div className="p-2.5 bg-white border border-[#111] rounded-[10px] flex items-center justify-between">
                <span>😴 Schedule</span>
                <span className="font-black text-gray-700">{sleepTime.split('(')[0]}</span>
              </div>
              <div className="p-2.5 bg-white border border-[#111] rounded-[10px] flex items-center justify-between">
                <span>🧹 Cleanliness</span>
                <span className="font-black text-gray-700">{cleanliness}</span>
              </div>
              <div className="p-2.5 bg-white border border-[#111] rounded-[10px] flex items-center justify-between">
                <span>🍲 Food</span>
                <span className="font-black text-gray-700">{foodPreference}</span>
              </div>
              <div className="p-2.5 bg-white border border-[#111] rounded-[10px] flex items-center justify-between">
                <span>🚭 Smoking</span>
                <span className="font-black text-gray-700">{smoking}</span>
              </div>
            </div>
          </div>

          {/* Danger Zone: Reset Data */}
          <div className="p-4 bg-white border-[2px] border-dashed border-red-300 rounded-[16px] text-center">
            <button
              type="button"
              onClick={handleResetData}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-800 transition-colors cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Reset All Local Storage Data (Testing)</span>
            </button>
          </div>
        </div>

        {/* Right Section: Habits Selection Form (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-white p-5 md:p-7 space-y-5">
            <h2 className="font-heading font-black text-base md:text-lg text-[#111] uppercase tracking-wide pb-2 border-b-[2px] border-[#111]">
              Personal Information
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
          </Card>

          {/* Habits Section */}
          <Card className="bg-white p-5 md:p-7 space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b-[2px] border-[#111]">
              <Sparkles size={18} className="text-[#FFD23F]" />
              <h2 className="font-heading font-black text-base md:text-lg text-[#111] uppercase tracking-wide">
                Living Habits & Preferences
              </h2>
            </div>

            {/* Sleep schedule */}
            <div className="space-y-2">
              <label className="block text-xs md:text-sm font-black text-[#111]">
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
              <label className="block text-xs md:text-sm font-black text-[#111]">
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
              <label className="block text-xs md:text-sm font-black text-[#111]">
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
              <label className="block text-xs md:text-sm font-black text-[#111]">
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
              <label className="block text-xs md:text-sm font-black text-[#111]">
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

            {/* Save CTA */}
            <div className="pt-2">
              <Button type="submit" variant="primary" fullWidth size="lg">
                <Save size={18} />
                <span>Save Profile Changes</span>
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
