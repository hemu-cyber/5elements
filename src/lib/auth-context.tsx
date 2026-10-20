import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile, UserRole } from '@/types/database';
import { getProfiles, saveProfile } from './store';
import { supabase, isSupabaseConfigured } from './supabase';

interface AuthContextType {
  user: Profile | null;
  role: UserRole | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginDemo: (role: UserRole) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: string; message?: string }>;
  verifySignupOtp: (email: string, token: string) => Promise<{ error?: string }>;
  resendConfirmation: (email: string) => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const DEMO_USER_PROFILE: Profile = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'alex@linkpulse.io',
  role: 'user',
  created_at: '2026-09-01T00:00:00Z',
};

const DEMO_ADMIN_PROFILE: Profile = {
  id: '00000000-0000-0000-0000-000000000002',
  email: 'admin@linkpulse.io',
  role: 'admin',
  created_at: '2026-09-01T00:00:00Z',
};

async function getSupabaseProfile(userId: string, email: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data || {
    id: userId,
    email,
    role: 'user',
    created_at: new Date().toISOString(),
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(() => {
    if (isSupabaseConfigured) return null;
    try {
      const cached = localStorage.getItem('linkpulse_session');
      if (!cached) return null;
      const session = JSON.parse(cached) as Profile;
      return getProfiles().find((profile) => profile.id === session.id) || null;
    } catch {
      localStorage.removeItem('linkpulse_session');
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (
    localStorage.getItem('linkpulse_theme') === 'dark' ? 'dark' : 'light'
  ));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('linkpulse_theme', theme);
  }, [theme]);

  useEffect(() => {
    let mounted = true;
    async function initAuth() {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (data.session?.user && mounted) {
            if (!data.session.user.email_confirmed_at) {
              const { error: signOutError } = await supabase.auth.signOut();
              if (signOutError) throw signOutError;
              if (mounted) setUser(null);
            } else {
              const profile = await getSupabaseProfile(
                data.session.user.id,
                data.session.user.email || ''
              );
              if (mounted) setUser(profile);
            }
          }
        } catch (error) {
          console.error('Unable to restore Supabase session:', error);
        }
      }
      if (mounted) setIsLoading(false);
    }
    void initAuth();
    return () => {
      mounted = false;
    };
  }, []);

  const loginDemo = async (role: UserRole) => {
    if (isSupabaseConfigured) {
      throw new Error('Demo accounts are only available when Supabase is not configured.');
    }
    const profile = role === 'admin' ? DEMO_ADMIN_PROFILE : DEMO_USER_PROFILE;
    saveProfile(profile);
    setUser(profile);
    localStorage.setItem('linkpulse_session', JSON.stringify(profile));
  };

  const loginWithEmail = async (email: string, password: string): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        return { error: 'Email sign-in requires Supabase. Configure it first, or use a demo workspace.' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) return { error: error.message };
      if (!data.user) return { error: 'The authentication provider did not return a user.' };
      if (!data.user.email_confirmed_at) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
        setUser(null);
        return { error: 'Please confirm your email address before signing in.' };
      }
      const profile = await getSupabaseProfile(data.user.id, data.user.email || email);
      setUser(profile);
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unable to sign in.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string
  ): Promise<{ error?: string; message?: string }> => {
    setIsLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!isSupabaseConfigured) {
        return { error: 'Email verification requires Supabase. Configure it first to create an account.' };
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: { role: 'user' } },
      });
      if (error) return { error: error.message };
      if (data.user && !data.user.email_confirmed_at && data.session) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
        setUser(null);
        return { message: 'Account created. Enter the confirmation code sent to your email.' };
      }
      if (!data.session) {
        return { message: 'Account created. Enter the confirmation code sent to your email.' };
      }
      if (!data.user) return { error: 'The authentication provider did not return a user.' };
      setUser(await getSupabaseProfile(data.user.id, data.user.email || normalizedEmail));
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unable to create the account.' };
    } finally {
      setIsLoading(false);
    }
  };

  const verifySignupOtp = async (
    email: string,
    token: string
  ): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        return { error: 'Email verification requires Supabase. Configure it first.' };
      }
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: token.trim(),
        type: 'signup',
      });
      if (error) return { error: error.message };
      if (!data.user) return { error: 'The verification response did not include a user.' };
      if (!data.user.email_confirmed_at) {
        return { error: 'Supabase did not confirm this email. Check the code and try again.' };
      }
      setUser(await getSupabaseProfile(data.user.id, data.user.email || email));
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unable to verify the email code.' };
    } finally {
      setIsLoading(false);
    }
  };

  const resendConfirmation = async (
    email: string
  ): Promise<{ error?: string; message?: string }> => {
    if (!isSupabaseConfigured) {
      return { error: 'Email verification requires Supabase. Configure it first.' };
    }
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });
      if (error) return { error: error.message };
      return { message: 'A new confirmation email has been sent.' };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unable to resend the confirmation email.' };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    setUser(null);
    localStorage.removeItem('linkpulse_session');
  };

  const toggleTheme = () => setTheme((previous) => (previous === 'light' ? 'dark' : 'light'));
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAdmin,
        isAuthenticated: !!user,
        isLoading,
        loginDemo,
        loginWithEmail,
        signUpWithEmail,
        verifySignupOtp,
        resendConfirmation,
        signOut,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
