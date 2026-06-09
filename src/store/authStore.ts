import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from '@propertypulse/shared-types';
import { authService } from '../services/api/authService';
import { supabase } from '../services/supabase/supabaseClient';
import { env } from '../config/env';

type Status = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: Status;
  user: UserProfile | null;
  session: Session | null;
  isDemo: boolean;
  init: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, fullName: string) => Promise<{ needsConfirmation: boolean }>;
  signInGoogle: () => Promise<void>;
  signInDemo: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const DEMO_USER: UserProfile = {
  id: 'demo-user',
  email: 'ahmed@propertypulse.app',
  fullName: 'Ahmed',
  role: 'admin',
  createdAt: new Date('2024-01-15').toISOString(),
};

async function loadProfile(session: Session): Promise<UserProfile> {
  const profile = await authService.fetchProfile(session.user.id);
  return (
    profile ?? {
      id: session.user.id,
      email: session.user.email ?? '',
      fullName: (session.user.user_metadata?.full_name as string) ?? undefined,
      role: 'investor',
      avatarUrl: (session.user.user_metadata?.avatar_url as string) ?? undefined,
      createdAt: session.user.created_at ?? new Date().toISOString(),
    }
  );
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  user: null,
  session: null,
  isDemo: false,

  async init() {
    if (!env.hasSupabase) {
      // No backend configured → start signed-out in demo mode.
      set({ status: 'unauthenticated' });
      return;
    }
    try {
      const session = await authService.getSession();
      if (session) {
        const user = await loadProfile(session);
        set({ status: 'authenticated', session, user });
      } else {
        set({ status: 'unauthenticated' });
      }
    } catch {
      set({ status: 'unauthenticated' });
    }

    supabase?.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const user = await loadProfile(session);
        set({ status: 'authenticated', session, user });
      } else if (!get().isDemo) {
        set({ status: 'unauthenticated', session: null, user: null });
      }
    });
  },

  async signInEmail(email, password) {
    const session = await authService.signInWithEmail({ email, password });
    const user = await loadProfile(session);
    set({ status: 'authenticated', session, user, isDemo: false });
  },

  async signUpEmail(email, password, fullName) {
    const { session, needsConfirmation } = await authService.signUpWithEmail(email, password, fullName);
    if (session) {
      const user = await loadProfile(session);
      set({ status: 'authenticated', session, user, isDemo: false });
    }
    return { needsConfirmation };
  },

  async signInGoogle() {
    const session = await authService.signInWithGoogle();
    const user = await loadProfile(session);
    set({ status: 'authenticated', session, user, isDemo: false });
  },

  signInDemo() {
    set({ status: 'authenticated', user: DEMO_USER, session: null, isDemo: true });
  },

  async signOut() {
    await authService.signOut();
    set({ status: 'unauthenticated', user: null, session: null, isDemo: false });
  },

  async refreshProfile() {
    const { session } = get();
    if (!session) return;
    const user = await loadProfile(session);
    set({ user });
  },
}));