import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { env } from '../../config/env';

// SecureStore caps values at ~2KB and only allows [A-Za-z0-9._-] keys.
// Supabase session payloads can exceed that, so we chunk large values.
const CHUNK = 1800;

const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const head = await SecureStore.getItemAsync(key);
    if (head == null) return null;
    if (!head.startsWith('§chunks§')) return head;
    const count = Number(head.slice('§chunks§'.length));
    let value = '';
    for (let i = 0; i < count; i += 1) {
      value += (await SecureStore.getItemAsync(`${key}_${i}`)) ?? '';
    }
    return value;
  },
  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const count = Math.ceil(value.length / CHUNK);
    await SecureStore.setItemAsync(key, `§chunks§${count}`);
    for (let i = 0; i < count; i += 1) {
      await SecureStore.setItemAsync(`${key}_${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
    }
  },
  async removeItem(key: string): Promise<void> {
    const head = await SecureStore.getItemAsync(key);
    if (head?.startsWith('§chunks§')) {
      const count = Number(head.slice('§chunks§'.length));
      for (let i = 0; i < count; i += 1) await SecureStore.deleteItemAsync(`${key}_${i}`);
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase: SupabaseClient | null = env.hasSupabase
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        storage: Platform.OS === 'web' ? undefined : secureStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

/** Throws a friendly error when Supabase is required but not configured. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in apps/mobile/.env',
    );
  }
  return supabase;
}