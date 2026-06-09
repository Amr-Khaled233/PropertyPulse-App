import axios, { type AxiosInstance } from 'axios';
import { env } from '../../config/env';
import { supabase } from '../supabase/supabaseClient';

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the current Supabase access token to every request.
apiClient.interceptors.request.use(async (config) => {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unwrap the server's { success, data } envelope into the payload.
apiClient.interceptors.response.use(
  (res) => {
    if (res.data && typeof res.data === 'object' && 'data' in res.data) {
      res.data = (res.data as { data: unknown }).data;
    }
    return res;
  },
  (error) => {
    const message =
      error.response?.data?.error?.message ?? error.message ?? 'Network request failed';
    return Promise.reject(new Error(message));
  },
);