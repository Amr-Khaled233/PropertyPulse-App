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
  let token = await tokenStore.getAccess();
  if (!token && supabase) {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token ?? null;
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Surface the backend's friendly error message (e.g. "Free plan is limited to N
// AI reports per month…") instead of Axios's generic "Request failed with status
// code 4xx". Without this, every failed request shows the raw status text.
instance.interceptors.response.use(
  (res) => res,
  (error) => {
    const data = error?.response?.data as ApiResponse<unknown> | undefined;
    const message = data?.error?.message ?? error?.message ?? 'Network request failed';
    return Promise.reject(new Error(message));
  },
);

export interface RequestMeta {
  page?: number;
  pageSize?: number;
  total?: number;
}

async function unwrap<T>(p: Promise<{ data: ApiResponse<T> }>): Promise<{ data: T; meta?: RequestMeta }> {
  const res = await p;
  const body = res.data;
  if (!body.success || body.data === undefined) {
    throw new Error(body.error?.message ?? 'Request failed');
  }
  return { data: body.data, meta: body.meta as RequestMeta | undefined };
}

export const apiClient = {
  async get<T>(url: string, params?: Record<string, unknown>) {
    return unwrap<T>(instance.get<ApiResponse<T>>(url, { params }));
  },
  async post<T>(url: string, data?: unknown) {
    return unwrap<T>(instance.post<ApiResponse<T>>(url, data));
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
