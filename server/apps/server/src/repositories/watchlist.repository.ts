// Watchlist repository — watchlist_items and property_alerts access.

import { supabase } from '../config/supabase.js';
import { ApiError } from '../utils/apiError.js';
import {
  toWatchlistItem,
  toPropertyAlert,
  type WatchlistRow,
  type AlertRow,
  type PropertyAlert,
} from '../models/watchlist.model.js';
import type { WatchlistItem } from '@propertypulse/shared-types';

export const watchlistRepository = {
  async listForUser(userId: string): Promise<WatchlistItem[]> {
    const { data, error } = await supabase
      .from('watchlist_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new ApiError(500, 'WATCHLIST_LIST_FAILED', error.message);
    return (data as WatchlistRow[]).map(toWatchlistItem);
  },

  async add(input: {
    userId: string;
    propertyId: string;
    notes?: string;
    notifyOnChange?: boolean;
  }): Promise<WatchlistItem> {
    const { data, error } = await supabase
      .from('watchlist_items')
      .upsert(
        {
          user_id: input.userId,
          property_id: input.propertyId,
          notes: input.notes ?? null,
          notify_on_change: input.notifyOnChange ?? true,
        },
        { onConflict: 'user_id,property_id' },
      )
      .select('*')
      .single();
    if (error) throw new ApiError(500, 'WATCHLIST_ADD_FAILED', error.message);
    return toWatchlistItem(data as WatchlistRow);
  },

  async remove(userId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('watchlist_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw new ApiError(500, 'WATCHLIST_REMOVE_FAILED', error.message);
  },

  /** All watchlist items whose owner opted in to change notifications. */
  async listAllToNotify(): Promise<WatchlistItem[]> {
    const { data, error } = await supabase
      .from('watchlist_items')
      .select('*')
      .eq('notify_on_change', true);
    if (error) throw new ApiError(500, 'WATCHLIST_NOTIFY_LIST_FAILED', error.message);
    return (data as WatchlistRow[]).map(toWatchlistItem);
  },

  async createAlert(input: {
    userId: string;
    propertyId: string;
    kind: string;
    message: string;
    payload?: Record<string, unknown>;
  }): Promise<PropertyAlert> {
    const { data, error } = await supabase
      .from('property_alerts')
      .insert({
        user_id: input.userId,
        property_id: input.propertyId,
        kind: input.kind,
        message: input.message,
        payload: input.payload ?? {},
      })
      .select('*')
      .single();
    if (error) throw new ApiError(500, 'ALERT_CREATE_FAILED', error.message);
    return toPropertyAlert(data as AlertRow);
  },

  async listAlerts(userId: string): Promise<PropertyAlert[]> {
    const { data, error } = await supabase
      .from('property_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new ApiError(500, 'ALERT_LIST_FAILED', error.message);
    return (data as AlertRow[]).map(toPropertyAlert);
  },
};
