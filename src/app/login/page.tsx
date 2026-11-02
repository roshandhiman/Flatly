'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmail, signUpWithEmail } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Check, KeyRound, Mail, ShieldCheck, Sparkles, User } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const { setProfile, profile } = useStore();

  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setError('Email aur password required hai');
      return;
    }

    if (password.length < 6) {
      setError('Password kam se kam 6 characters ka hona chahiye');
      return;
    }

    setLoading(true);

    if (isSignUp) {
      if (!fullName.trim()) {
        setError('Aapka poora naam required hai');
        setLoading(false);
        return;
      }

      const res = await signUpWithEmail(email.trim(), password, fullName.trim());
      setLoading(false);

      if (res.success) {
        setSuccessMsg('Account create ho gaya! Welcome to Flatly.');
        await setProfile({
          name: fullName.trim(),
          habits: profile?.habits || {
            sleepTime: 'Moderate (11 PM - 1 AM)',
            cleanliness: 'Regular tidy up',
            guests: 'Weekends only',
            foodPreference: 'No preference',
            smoking: 'Non-smoker',
          },
        });
        setTimeout(() => router.push(redirectTo), 900);
      } else {
        setError(res.error || 'Signup failed. Please try again.');
      }
    } else {
      const res = await signInWithEmail(email.trim(), password);
      setLoading(false);

      if (res.success) {
        setSuccessMsg('Login successful! Redirecting...');
        const resolvedName =
          res.data?.user?.user_metadata?.full_name ||
          res.data?.user?.user_metadata?.name ||
          profile?.name ||
          email.split('@')[0] ||
          'Roommate';

        await setProfile({
          name: resolvedName,
          habits: profile?.habits || {
            sleepTime: 'Moderate (11 PM - 1 AM)',
            cleanliness: 'Regular tidy up',
            guests: 'Weekends only',
            foodPreference: 'No preference',
            smoking: 'Non-smoker',
          },
        });
        setTimeout(() => router.push(redirectTo), 800);
      } else {
        setError(res.error || 'Invalid email or password. Please check your credentials.');
      }
    }
  };

  return (
    <div className="p-4 space-y-5 max-w-md mx-auto my-6">
      {/* Top back navigation */}
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="w-9 h-9 rounded-[10px] bg-white border-[2px] border-[#111] shadow-[2px_2px_0_#111] flex items-center justify-center hover:bg-gray-100 transition-colors"
          title="Back to Home"
        >
          <ArrowLeft size={16} />
        </Link>
        <span className="font-heading font-black text-xs uppercase tracking-wider text-gray-500">
          Flatly Authentication
        </span>
      </div>

      {/* Auth Card */}
      <div className="p-6 md:p-8 bg-white border-[3px] border-[#111] rounded-[24px] shadow-[8px_8px_0_#111] space-y-6">
        {/* Header Icon + Titles */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-[18px] bg-[#FFD23F] border-[2.5px] border-[#111] shadow-[3px_3px_0_#111] flex items-center justify-center text-2xl mx-auto mb-2">
            ✉️
          </div>
          <h1 className="font-heading font-black text-2xl text-[#111]">
            {isSignUp ? 'Create Flatly Account' : 'Login with Email'}
          </h1>
          <p className="text-xs font-semibold text-gray-500 max-w-xs mx-auto">
            {isSignUp
              ? 'Join Flatly to split rent, sync chores, and chat with flatmates on cloud'
              : 'Enter your email & password to access your flat and saved rooms'}
          </p>
        </div>

        {/* Tab Toggle (Sign In vs Sign Up) */}
        <div className="flex p-1 bg-[#FFF8EC] border-[2px] border-[#111] rounded-[14px]">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 text-xs font-heading font-black rounded-[10px] transition-all cursor-pointer ${
              !isSignUp
                ? 'bg-[#FFD23F] text-[#111] border-[1.5px] border-[#111] shadow-[1.5px_1.5px_0_#111]'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 text-xs font-heading font-black rounded-[10px] transition-all cursor-pointer ${
              isSignUp
                ? 'bg-[#FFD23F] text-[#111] border-[1.5px] border-[#111] shadow-[1.5px_1.5px_0_#111]'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="p-3 bg-red-100 border-[2px] border-red-500 rounded-[12px] text-xs font-bold text-red-700 shadow-[2px_2px_0_#111]">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-[#3DDC97] border-[2px] border-[#111] rounded-[12px] text-xs font-black text-[#111] flex items-center gap-2 shadow-[2px_2px_0_#111]">
            <Check size={16} strokeWidth={3} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="font-heading font-black text-xs text-[#111] uppercase tracking-wider block">
                Aapka Poora Naam
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. Roshan Dhiman"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs font-bold bg-[#FFF8EC] border-[2px] border-[#111] rounded-[12px] shadow-[2px_2px_0_#111] focus:outline-none focus:bg-white"
                  autoFocus={isSignUp}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-heading font-black text-xs text-[#111] uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs font-bold bg-[#FFF8EC] border-[2px] border-[#111] rounded-[12px] shadow-[2px_2px_0_#111] focus:outline-none focus:bg-white"
                autoFocus={!isSignUp}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-heading font-black text-xs text-[#111] uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                placeholder="Kam se kam 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs font-bold bg-[#FFF8EC] border-[2px] border-[#111] rounded-[12px] shadow-[2px_2px_0_#111] focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            disabled={loading}
          >
            <span>{loading ? 'Processing...' : isSignUp ? 'Create Free Account' : 'Sign In with Email'}</span>
            <Sparkles size={16} />
          </Button>
        </form>

        {/* Security / Cloud note */}
        <div className="pt-2 border-t-[1.5px] border-gray-100 text-center">
          <p className="text-[11px] font-semibold text-gray-500">
            🔒 Supabase Auth encrypted. Your flat hisab, chores, and rooms data stay private.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold text-[#111]">Loading Flatly Login...</div>}>
      <LoginContent />
    </Suspense>
  );
}
