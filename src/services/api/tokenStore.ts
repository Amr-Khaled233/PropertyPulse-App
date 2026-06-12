// Bearer token storage for the backend API. The backend's /auth/login returns
// an accessToken which we persist (SecureStore) and attach to every request.

import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'pp_access_token';
const REFRESH_KEY = 'pp_refresh_token';

let cachedAccess: string | null = null;

export const tokenStore = {
  async getAccess(): Promise<string | null> {
    if (cachedAccess) return cachedAccess;
    cachedAccess = await SecureStore.getItemAsync(ACCESS_KEY);
    return cachedAccess;
  },
  async set(accessToken: string, refreshToken?: string): Promise<void> {
    cachedAccess = accessToken;
    await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
    if (refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  },
  async clear(): Promise<void> {
    cachedAccess = null;
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};
