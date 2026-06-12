// Watchlist & alert entity mapping: database rows <-> domain types.

import type { WatchlistItem } from '@propertypulse/shared-types';

export interface WatchlistRow {
  id: string;
  user_id: string;
  property_id: string;
  notes: string | null;
  notify_on_change: boolean;
  created_at: string;
}

export interface AlertRow {
  id: string;
  user_id: string;
  property_id: string;
  kind: string;
  message: string;
  payload: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface PropertyAlert {
  id: string;
  userId: string;
  propertyId: string;
  kind: string;
  message: string;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export function toWatchlistItem(row: WatchlistRow): WatchlistItem {
  return {
    id: row.id,
    userId: row.user_id,
    propertyId: row.property_id,
    notes: row.notes ?? undefined,
    notifyOnChange: row.notify_on_change,
    createdAt: row.created_at,
  };
}

export function toPropertyAlert(row: AlertRow): PropertyAlert {
  return {
    id: row.id,
    userId: row.user_id,
    propertyId: row.property_id,
    kind: row.kind,
    message: row.message,
    payload: row.payload ?? {},
    read: row.read,
    createdAt: row.created_at,
  };
}
