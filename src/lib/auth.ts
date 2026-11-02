import { supabase } from './supabase';

export interface AuthResponse {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * 1. Send OTP to Indian mobile number (e.g. +91 9876543210)
 */
export async function sendPhoneOTP(phone: string): Promise<AuthResponse> {
  try {
    const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`;
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 2. Verify Phone OTP
 */
export async function verifyPhoneOTP(phone: string, token: string): Promise<AuthResponse> {
  try {
    const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`;
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token,
      type: 'sms',
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 3. Sign in with Email Magic Link (Passwordless)
 */
export async function sendEmailMagicLink(email: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 4. Sign in with Email & Password
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 5. Sign up with Email & Password
 */
export async function signUpWithEmail(email: string, password: string, fullName: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 6. Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<void> {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });
}

/**
 * 7. Sign Out
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * 8. Get current logged in user
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
