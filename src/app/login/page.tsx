'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  sendPhoneOTP,
  verifyPhoneOTP,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
} from '@/lib/auth';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Check, KeyRound, Mail, Phone, ShieldCheck, Sparkles } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const { setProfile, profile } = useStore();

  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [isSignUp, setIsSignUp] = useState(false);

  // Phone states
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Email states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Phone OTP flow
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Mobile number daaliye');
      return;
    }
    setError('');
    setLoading(true);

    const res = await sendPhoneOTP(phone);
    setLoading(false);

    if (res.success) {
      setOtpSent(true);
      setSuccessMsg(`OTP bheja gaya ${phone} par!`);
    } else {
      setError(res.error || 'Failed to send OTP. Please check the number.');
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('OTP daaliye');
      return;
    }
    setError('');
    setLoading(true);

    const res = await verifyPhoneOTP(phone, otp);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Phone verified! Logged in.');
      if (!profile?.name) {
        setProfile({
          name: `Roommate ${phone.slice(-4)}`,
          habits: {
            sleepTime: 'Moderate (11 PM - 1 AM)',
            cleanliness: 'Regular tidy up',
            guests: 'Weekends only',
            foodPreference: 'No preference',
            smoking: 'Non-smoker',
          },
        });
      }
      setTimeout(() => router.push(redirectTo), 1000);
    } else {
      setError(res.error || 'Invalid OTP. Please try again.');
    }
  };

  // 2. Email / Password flow
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSignUp) {
      if (!fullName.trim()) {
        setError('Aapka naam required hai');
        setLoading(false);
        return;
      }
      const res = await signUpWithEmail(email, password, fullName);
      setLoading(false);
      if (res.success) {
        setSuccessMsg('Account created! Please check your email or proceed.');
        setProfile({
          name: fullName.trim(),
          habits: {
            sleepTime: 'Moderate (11 PM - 1 AM)',
            cleanliness: 'Regular tidy up',
            guests: 'Weekends only',
            foodPreference: 'No preference',
            smoking: 'Non-smoker',
          },
        });
        setTimeout(() => router.push(redirectTo), 1200);
      } else {
        setError(res.error || 'Signup failed');
      }
    } else {
      const res = await signInWithEmail(email, password);
      setLoading(false);
      if (res.success) {
        setSuccessMsg('Logged in successfully!');
        setTimeout(() => router.push(redirectTo), 1000);
      } else {
        setError(res.error || 'Invalid email or password');
      }
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Top back navigation */}
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="w-9 h-9 rounded-[10px] bg-white border-[2px] border-[#111] shadow-[2px_2px_0_#111] flex items-center justify-center hover:bg-gray-100"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-black text-[#111]">
            Login to Flatly
          </h1>
          <p className="text-[11px] font-semibold text-gray-500">
            Connect your shared living profile
          </p>
        </div>
      </div>

      {/* Auth Method Switcher Tabs */}
      <div className="flex gap-2 p-1 bg-white border-[2px] border-[#111] rounded-[12px] shadow-[3px_3px_0_#111]">
        <button
          onClick={() => {
            setAuthMethod('phone');
            setError('');
            setSuccessMsg('');
          }}
          className={`flex-1 py-1.5 rounded-[8px] text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer ${
            authMethod === 'phone'
              ? 'bg-[#FFD23F] text-[#111] shadow-[2px_2px_0_#111] border-[1.5px] border-[#111]'
              : 'text-gray-500 hover:text-[#111]'
          }`}
        >
          <Phone size={13} />
          <span>Phone OTP</span>
        </button>
        <button
          onClick={() => {
            setAuthMethod('email');
            setError('');
            setSuccessMsg('');
          }}
          className={`flex-1 py-1.5 rounded-[8px] text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer ${
            authMethod === 'email'
              ? 'bg-[#FFD23F] text-[#111] shadow-[2px_2px_0_#111] border-[1.5px] border-[#111]'
              : 'text-gray-500 hover:text-[#111]'
          }`}
        >
          <Mail size={13} />
          <span>Email & Password</span>
        </button>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="p-3 bg-[#3DDC97] border-[2px] border-[#111] rounded-[12px] text-xs font-black text-[#111] flex items-center gap-2 animate-slide-up">
          <Check size={16} strokeWidth={3} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="p-3 bg-[#FFF0F0] border-[2px] border-[#FF3B3B] rounded-[12px] text-xs font-bold text-[#FF3B3B] animate-slide-up">
          {error}
        </div>
      )}

      {/* 1. Phone Auth Screen */}
      {authMethod === 'phone' && (
        <Card className="bg-white space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] bg-[#FFD23F] border-[2px] border-[#111] flex items-center justify-center font-black">
              📱
            </div>
            <div>
              <h2 className="font-heading font-black text-sm text-[#111]">
                Quick Mobile Login
              </h2>
              <p className="text-[11px] font-semibold text-gray-500">
                10-digit Indian number daalein
              </p>
            </div>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSendOTP} className="space-y-3">
              <Input
                label="Phone Number"
                placeholder="e.g. 9876543210"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="md"
                disabled={loading}
              >
                <span>{loading ? 'Sending OTP...' : 'Send OTP'}</span>
                <Sparkles size={16} />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-3">
              <Input
                label="Enter 6-digit OTP"
                placeholder="123456"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoFocus
              />

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Sent to {phone}</span>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="font-bold underline text-blue-600 cursor-pointer"
                >
                  Change number
                </button>
              </div>

              <Button
                type="submit"
                variant="mint"
                fullWidth
                size="md"
                disabled={loading}
              >
                <span>{loading ? 'Verifying...' : 'Verify & Continue'}</span>
                <ShieldCheck size={16} />
              </Button>
            </form>
          )}
        </Card>
      )}

      {/* 2. Email Auth Screen */}
      {authMethod === 'email' && (
        <Card className="bg-white space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-[2px] border-[#111]">
            <h2 className="font-heading font-black text-sm text-[#111]">
              {isSignUp ? 'Create New Account' : 'Welcome Back'}
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-xs font-bold text-blue-600 underline cursor-pointer"
            >
              {isSignUp ? 'Existing user? Login' : 'New to Flatly? Sign Up'}
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            {isSignUp && (
              <Input
                label="Full Name"
                placeholder="e.g. Roshan Dhiman"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            )}

            <Input
              label="Email Address"
              placeholder="you@domain.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="md"
              disabled={loading}
            >
              <span>{loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Log In'}</span>
              <KeyRound size={16} />
            </Button>
          </form>
        </Card>
      )}

      {/* Google OAuth Button */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => signInWithGoogle()}
          className="w-full py-2.5 px-4 bg-white border-[2.5px] border-[#111] rounded-[12px] shadow-[4px_4px_0_#111] text-xs font-black flex items-center justify-center gap-2 hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold text-[#111]">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
