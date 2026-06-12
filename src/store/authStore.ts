// Auth/session state (zustand). Backed by the backend /auth endpoints via
// authService; Supabase is used only for the Google OAuth handshake.

import { create } from 'zustand';
import type { UserProfile } from '../types/user';
import { authService } from '../services/api/authService';

type Status = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: Status;
  user: UserProfile | null;
  error: string | null;
  init: () => Promise<void>;
  setUser: (user: UserProfile) => void;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (fullName: string, email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  error: null,

  async init() {
    try {
      if (await authService.hasSession()) {
        const user = await authService.me();
        set({ status: 'authenticated', user, error: null });
      } else {
        set({ status: 'unauthenticated', user: null });
      }
    } catch {
      set({ status: 'unauthenticated', user: null });
    }
  },

  setUser(user) {
    set({ user });
  },

  async signInEmail(email, password) {
    const user = await authService.login(email, password);
    set({ status: 'authenticated', user, error: null });
  },

  async signUpEmail(fullName, email, password) {
    const user = await authService.register(fullName, email, password);
    set({ status: 'authenticated', user, error: null });
  },

  async signInGoogle() {
    const user = await authService.signInWithGoogle();
    set({ status: 'authenticated', user, error: null });
  },

  async signOut() {
    await authService.signOut();
    set({ status: 'unauthenticated', user: null });
  },

  async refreshProfile() {
    try {
      const user = await authService.me();
      set({ user });
    } catch {
      /* keep current */
    }
  },
}));
