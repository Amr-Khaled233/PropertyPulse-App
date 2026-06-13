// Axios instance for the backend API (http://<LAN-IP>:4000/api) + a typed
// wrapper that unwraps the server's ApiResponse<T> envelope so services receive
// plain data (mirrors the web app's apiClient). Attaches the stored backend
// Bearer token, falling back to the Supabase session token (after Google OAuth).

import axios, { type AxiosInstance } from 'axios';
import { env } from '../../config/env';
import { supabase } from '../supabase/supabaseClient';
import { tokenStore } from './tokenStore';
import type { ApiResponse } from '../../types/api';

const instance: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

instance.interceptors.request.use(async (config) => {
  let token: string | null = null;

  // Prefer the live Supabase session — getSession() always returns a valid,
  // auto-refreshed token when a session exists, so the stored token never
  // gets sent stale after the 1-hour Supabase expiry.
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token ?? null;
  }

  // Fall back to tokenStore for sessions not tracked by the Supabase client.
  if (!token) token = await tokenStore.getAccess();

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Surface the backend's friendly error message. On 401, attempt a token refresh
// and retry once before giving up — handles tokens that expired mid-session.
instance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry && supabase) {
      original._retry = true;
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed.session) {
        const { access_token, refresh_token } = refreshed.session;
        await tokenStore.set(access_token, refresh_token ?? '');
        original.headers.Authorization = `Bearer ${access_token}`;
        return instance(original);
      }
      // Refresh failed — clear stored tokens so the auth gate redirects to login.
      await tokenStore.clear();
      await supabase.auth.signOut();
    }
    const data = error?.response?.data as ApiResponse<unknown> | undefined;
    const message = data?.error?.message ?? error?.message ?? 'Network request failed';
    return Promise.reject(makeError(message, data?.error?.code));
  },
);

export interface RequestMeta {
  page?: number;
  pageSize?: number;
  total?: number;
}

function makeError(message: string, code?: string): Error {
  const err = new Error(message);
  if (code) (err as Error & { code: string }).code = code;
  return err;
}

async function unwrap<T>(p: Promise<{ data: ApiResponse<T> }>): Promise<{ data: T; meta?: RequestMeta }> {
  const res = await p;
  const body = res.data;
  if (!body.success || body.data === undefined) {
    throw makeError(body.error?.message ?? 'Request failed', body.error?.code);
  }
  return { data: body.data, meta: body.meta as RequestMeta | undefined };
}

export const apiClient = {
  async get<T>(url: string, params?: Record<string, unknown>) {
    return unwrap<T>(instance.get<ApiResponse<T>>(url, { params }));
  },
  async post<T>(url: string, data?: unknown, timeout?: number) {
    return unwrap<T>(instance.post<ApiResponse<T>>(url, data, timeout ? { timeout } : undefined));
  },
  async put<T>(url: string, data?: unknown) {
    return unwrap<T>(instance.put<ApiResponse<T>>(url, data));
  },
  async delete<T>(url: string) {
    return unwrap<T>(instance.delete<ApiResponse<T>>(url));
  },
};

/** Raw axios instance — for callers needing the full response/headers. */
export const http = instance;

/** Normalize unknown errors to a readable message for the UI. */
export function toErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as ApiResponse<unknown>)?.error?.message ?? err.message;
  }
  return err instanceof Error ? err.message : 'Something went wrong';
}
