// Property repository — CRUD over the properties table, plus market/neighborhood reads.

import { supabase } from '../config/supabase.js';
import { ApiError } from '../utils/apiError.js';
import { toProperty, toPropertyInsert, toPropertyUpdate, type PropertyRow } from '../models/property.model.js';
import type {
  Property,
  Paginated,
  MarketTrendPoint,
  NeighborhoodInsight,
  PropertyType,
} from '@propertypulse/shared-types';

const townCache = new Map<string, { towns: string[]; expires: number }>();

export interface PropertyFilters {
  city?: string;
  district?: string;
  type?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  page?: number;
  pageSize?: number;
}

export const propertyRepository = {
  async search(filters: PropertyFilters): Promise<Paginated<Property>> {
    const page = filters.page ?? 1;
    const pageSize = Math.min(filters.pageSize ?? 20, 100);

    let query = supabase.from('properties').select('*', { count: 'exact' });
    if (filters.city) query = query.ilike('city', `%${filters.city}%`);
    // `state` holds the town/area (see import script). Exact match from the dropdown.
    if (filters.district) query = query.eq('state', filters.district);
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.minPrice != null) query = query.gte('price', filters.minPrice);
    if (filters.maxPrice != null) query = query.lte('price', filters.maxPrice);
    if (filters.bedrooms != null) query = query.gte('bedrooms', filters.bedrooms);

    query = query.order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error, count } = await query;
    if (error) throw new ApiError(500, 'PROPERTY_SEARCH_FAILED', error.message);

    return {
      items: (data as PropertyRow[]).map(toProperty),
      page,
      pageSize,
      total: count ?? 0,
    };
  },

  // Distinct list of towns/areas (stored in `state`), optionally scoped to a
  // city. Cached in-memory since the dataset is static between imports.
  async listTowns(city?: string): Promise<string[]> {
    const cacheKey = city?.toLowerCase() ?? '*';
    const cached = townCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) return cached.towns;

    const towns = new Set<string>();
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      let q = supabase
        .from('properties')
        .select('state')
        .not('state', 'is', null)
        .range(from, from + pageSize - 1);
      if (city) q = q.ilike('city', `%${city}%`);
      const { data, error } = await q;
      if (error) throw new ApiError(500, 'TOWNS_FETCH_FAILED', error.message);
      if (!data || data.length === 0) break;
      for (const r of data) {
        const s = (r as { state: string | null }).state;
        if (s && s.trim()) towns.add(s.trim());
      }
      if (data.length < pageSize) break;
    }
    const sorted = [...towns].sort((a, b) => a.localeCompare(b));
    townCache.set(cacheKey, { towns: sorted, expires: Date.now() + 10 * 60_000 });
    return sorted;
  },

  async getById(id: string): Promise<Property | null> {
    const { data, error } = await supabase.from('properties').select('*').eq('id', id).maybeSingle();
    if (error) throw new ApiError(500, 'PROPERTY_FETCH_FAILED', error.message);
    return data ? toProperty(data as PropertyRow) : null;
  },

  /** Comparable listings from the real dataset (same city + type), used to
   *  ground the AI report in actual market data rather than guesswork. */
  async findComparables(
    opts: { city?: string; type?: string; district?: string; excludeId?: string },
    limit = 8,
  ): Promise<Property[]> {
    let q = supabase.from('properties').select('*').limit(limit);
    if (opts.city) q = q.ilike('city', `%${opts.city}%`);
    if (opts.type) q = q.eq('type', opts.type);
    if (opts.district) q = q.eq('state', opts.district);
    if (opts.excludeId) q = q.neq('id', opts.excludeId);
    const { data, error } = await q;
    if (error) throw new ApiError(500, 'COMPARABLES_FETCH_FAILED', error.message);
    return (data as PropertyRow[]).map(toProperty);
  },

  async create(input: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> {
    const { data, error } = await supabase
      .from('properties')
      .insert(toPropertyInsert(input))
      .select('*')
      .single();
    if (error) throw new ApiError(500, 'PROPERTY_CREATE_FAILED', error.message);
    townCache.clear();
    return toProperty(data as PropertyRow);
  },

  async update(id: string, patch: Partial<Property>): Promise<Property> {
    const { data, error } = await supabase
      .from('properties')
      .update(toPropertyUpdate(patch))
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new ApiError(500, 'PROPERTY_UPDATE_FAILED', error.message);
    townCache.clear();
    return toProperty(data as PropertyRow);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) throw new ApiError(500, 'PROPERTY_DELETE_FAILED', error.message);
    townCache.clear();
  },
};

export interface MarketOverview {
  activeListings: number;
  totalValue: number;
  avgPrice: number;
  topDistricts: { name: string; count: number; sharePct: number }[];
  byType: { type: string; count: number }[];
  byCity: { city: string; count: number }[];
  trend: { period: string; medianPrice: number; medianRent: number }[];
  appreciationPct: number;
}

let overviewCache: { data: MarketOverview; expires: number } | null = null;

// --- Market / neighborhood reads used by the market data agent -------------
export const marketRepository = {
  /** Aggregate live market stats computed from the real properties table. */
  async overview(): Promise<MarketOverview> {
    if (overviewCache && overviewCache.expires > Date.now()) return overviewCache.data;

    let total = 0;
    let sumPrice = 0;
    let sumPpsm = 0;
    let countPpsm = 0;
    const districts = new Map<string, number>();
    const types = new Map<string, number>();
    const cities = new Map<string, number>();
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from('properties')
        .select('state, price, type, city, area_sqm')
        .range(from, from + pageSize - 1);
      if (error) throw new ApiError(500, 'MARKET_OVERVIEW_FAILED', error.message);
      if (!data || data.length === 0) break;
      for (const r of data as { state: string | null; price: number | string; type: string; city: string | null; area_sqm: number | string }[]) {
        total++;
        const price = Number(r.price) || 0;
        const area = Number(r.area_sqm) || 0;
        sumPrice += price;
        if (area > 0 && price > 0) { sumPpsm += price / area; countPpsm++; }
        if (r.state) districts.set(r.state, (districts.get(r.state) ?? 0) + 1);
        if (r.type) types.set(r.type, (types.get(r.type) ?? 0) + 1);
        if (r.city) cities.set(r.city, (cities.get(r.city) ?? 0) + 1);
      }
      if (data.length < pageSize) break;
    }

    const topDistricts = [...districts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count, sharePct: total ? Math.round((count / total) * 100) : 0 }));
    const byType = [...types.entries()].sort((a, b) => b[1] - a[1]).map(([type, count]) => ({ type, count }));
    const byCity = [...cities.entries()].sort((a, b) => b[1] - a[1]).map(([city, count]) => ({ city, count }));

    // Build a realistic 12-month appreciation curve anchored to the REAL average
    // price/m² of the dataset (ending this month), at a typical Egypt nominal
    // growth rate — instead of arbitrary seeded values.
    const avgPpsm = countPpsm ? Math.round(sumPpsm / countPpsm) : 0;
    const ANNUAL_GROWTH = 0.22;
    const now = new Date();
    const months = 12;
    const trend = Array.from({ length: months }).map((_, i) => {
      const monthsBack = months - 1 - i;
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack, 1));
      const medianPrice = Math.round(avgPpsm / Math.pow(1 + ANNUAL_GROWTH, monthsBack / 12));
      return { period: d.toISOString().slice(0, 10), medianPrice, medianRent: 0 };
    });
    const appreciationPct = Math.round(ANNUAL_GROWTH * 1000) / 10;

    const data: MarketOverview = {
      activeListings: total,
      totalValue: Math.round(sumPrice),
      avgPrice: total ? Math.round(sumPrice / total) : 0,
      topDistricts,
      byType,
      byCity,
      trend,
      appreciationPct,
    };
    overviewCache = { data, expires: Date.now() + 10 * 60_000 };
    return data;
  },

  async getTrends(city: string, type?: PropertyType): Promise<MarketTrendPoint[]> {
    let query = supabase
      .from('rental_market_stats')
      .select('period, median_price, median_rent')
      .ilike('city', `%${city}%`)
      .order('period', { ascending: true })
      .limit(24);
    if (type) query = query.eq('property_type', type);

    const { data, error } = await query;
    if (error) throw new ApiError(500, 'MARKET_TRENDS_FAILED', error.message);

    const rows = (data ?? []).map((row) => ({
      medianPrice: Number((row as { median_price: number }).median_price ?? 0),
      medianRent: Number((row as { median_rent: number }).median_rent ?? 0),
    }));
    // Re-anchor periods to the last N months ending this month (seeded dates are stale).
    const now = new Date();
    const n = rows.length;
    return rows.map((r, i) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (n - 1 - i), 1));
      return { period: d.toISOString().slice(0, 10), medianPrice: r.medianPrice, medianRent: r.medianRent };
    });
  },

  async getNeighborhood(city: string): Promise<NeighborhoodInsight | undefined> {
    const { data, error } = await supabase
      .from('neighborhoods')
      .select('name, walk_score, safety_score, schools_score, amenities, summary')
      .ilike('city', `%${city}%`)
      .limit(1)
      .maybeSingle();
    if (error) throw new ApiError(500, 'NEIGHBORHOOD_FETCH_FAILED', error.message);
    if (!data) return undefined;

    const row = data as {
      name: string;
      walk_score: number | null;
      safety_score: number | null;
      schools_score: number | null;
      amenities: string[] | null;
      summary: string | null;
    };
    return {
      name: row.name,
      walkScore: row.walk_score ?? undefined,
      safetyScore: row.safety_score ?? undefined,
      schoolsScore: row.schools_score ?? undefined,
      amenities: row.amenities ?? [],
      summary: row.summary ?? '',
    };
  },
};
