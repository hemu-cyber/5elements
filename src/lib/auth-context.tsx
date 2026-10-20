import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  getIdTokenResult,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import { Profile, UserRole } from '@/types/database';
import { getProfiles, saveProfile } from './store';
import { firebaseAuth, isFirebaseConfigured } from './firebase';

interface AuthContextType {
  user: Profile | null;
  role: UserRole | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginDemo: (role: UserRole) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<{ error?: string; message?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: string; message?: string }>;
  resendVerification: (email: string, password: string) => Promise<{ error?: string; message?: string }>;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function toProfile(firebaseUser: User): Promise<Profile> {
  const token = await getIdTokenResult(firebaseUser, true);
  const role: UserRole = token.claims.admin === true || token.claims.role === 'admin'
    ? 'admin'
    : 'user';
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    role,
    created_at: firebaseUser.metadata.creationTime || new Date().toISOString(),
  };
}

async function sendVerificationEmail(user: User): Promise<void> {
  await sendEmailVerification(user, {
    url: `${window.location.origin}/login`,
    handleCodeInApp: false,
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(() => {
    if (isFirebaseConfigured) return null;
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
    if (!firebaseAuth) {
      setIsLoading(false);
      return;
    }

    let mounted = true;
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      void (async () => {
        try {
          if (!firebaseUser) {
            if (mounted) setUser(null);
            return;
          }
          await reload(firebaseUser);
          if (!firebaseUser.emailVerified) {
            if (mounted) setUser(null);
            return;
          }
          const profile = await toProfile(firebaseUser);
          if (mounted) setUser(profile);
        } catch (error) {
          console.error('Unable to restore Firebase session:', error);
          if (mounted) setUser(null);
        } finally {
          if (mounted) setIsLoading(false);
        }
      })();
    }, (error) => {
      console.error('Unable to observe Firebase authentication state:', error);
      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const loginDemo = async (role: UserRole) => {
    if (isFirebaseConfigured) {
      throw new Error('Demo accounts are only available when Firebase is not configured.');
    }
    const profile = role === 'admin' ? DEMO_ADMIN_PROFILE : DEMO_USER_PROFILE;
    saveProfile(profile);
    setUser(profile);
    localStorage.setItem('linkpulse_session', JSON.stringify(profile));
  };

  const loginWithEmail = async (
    email: string,
    password: string
  ): Promise<{ error?: string; message?: string }> => {
    if (!firebaseAuth) {
      return { error: 'Email sign-in requires Firebase. Configure it first, or use a demo workspace.' };
    }
    setIsLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      await reload(credential.user);
      if (!credential.user.emailVerified) {
        await sendVerificationEmail(credential.user);
        await firebaseSignOut(firebaseAuth);
        return { message: 'Your email is not verified yet. We sent you a verification link.' };
      }
      setUser(await toProfile(credential.user));
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
    if (!firebaseAuth) {
      return { error: 'Email verification requires Firebase. Configure it first to create an account.' };
    }
    setIsLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
      try {
        await sendVerificationEmail(credential.user);
      } catch (error) {
        await firebaseSignOut(firebaseAuth);
        throw error;
      }
      await firebaseSignOut(firebaseAuth);
      setUser(null);
      return { message: 'Account created. Check your email and click the Firebase verification link.' };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unable to create the account.' };
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async (
    email: string,
    password: string
  ): Promise<{ error?: string; message?: string }> => {
    if (!firebaseAuth) {
      return { error: 'Email verification requires Firebase. Configure it first.' };
    }
    setIsLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      await reload(credential.user);
      if (credential.user.emailVerified) {
        setUser(await toProfile(credential.user));
        return { message: 'This email is already verified. You are signed in.' };
      }
      try {
        await sendVerificationEmail(credential.user);
      } finally {
        await firebaseSignOut(firebaseAuth);
      }
      return { message: 'A new Firebase verification link has been sent.' };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unable to resend the verification email.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    if (firebaseAuth) {
      await firebaseSignOut(firebaseAuth);
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
        resendVerification,
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
