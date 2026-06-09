import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Property, SearchParams } from '../types/listing';

interface UseListingsResult {
  properties: Property[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

const BASE_SELECT = `
  listing_id, title, property_type, offering_type, completion_status,
  price_egp, city, town, district, lat, lon,
  bedrooms, bathrooms, area_value, furnished,
  is_verified, is_premium, images_count, detail_url,
  agent_name, contact_phone, contact_whatsapp
`;

const buildQuery = (params: SearchParams, from: number, to: number) => {
  let query = supabase
    .from('properties')
    .select(BASE_SELECT, { count: 'exact' });

  if (params.offering_type === 'for_sale') {
    query = query.eq('offering_type', 'Residential for Sale');
  } else if (params.offering_type === 'for_rent') {
    query = query.eq('offering_type', 'Residential for Rent');
  }

  if (params.city)             query = query.eq('city', params.city);
  if (params.district)         query = query.eq('district', params.district);
  if (params.property_type)    query = query.eq('property_type', params.property_type);
  if (params.completion_status) query = query.eq('completion_status', params.completion_status);
  if (params.price_min)        query = query.gte('price_egp', params.price_min);
  if (params.price_max)        query = query.lte('price_egp', params.price_max);
  if (params.bedrooms_min)     query = query.gte('bedrooms', params.bedrooms_min);
  if (params.bathrooms_min)    query = query.gte('bathrooms', params.bathrooms_min);
  if (params.search)           query = query.ilike('title', `%${params.search}%`);

  return query.range(from, to).order('is_premium', { ascending: false });
};

export const useListings = (params: SearchParams = {}): UseListingsResult => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = params.limit || 20;

  const fetchListings = useCallback(async (reset = true) => {
    try {
      setLoading(true);
      setError(null);

      const from = reset ? 0 : offset;
      const to = from + limit - 1;

      const { data, error: supabaseError, count } = await buildQuery(params, from, to);

      if (supabaseError) throw new Error(supabaseError.message);

      setProperties(prev => reset ? (data || []) : [...prev, ...(data || [])]);
      setTotal(count || 0);
      setOffset(reset ? limit : offset + limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  }, [
    params.offering_type, params.city, params.district, params.property_type,
    params.completion_status, params.price_min, params.price_max,
    params.bedrooms_min, params.bathrooms_min, params.search, limit
  ]);

  useEffect(() => {
    fetchListings(true);
  }, [fetchListings]);

  const loadMore = useCallback(() => {
    if (!loading && offset < total) {
      fetchListings(false);
    }
  }, [loading, offset, total, fetchListings]);

  const refresh = useCallback(() => {
    fetchListings(true);
  }, [fetchListings]);

  return {
    properties,
    loading,
    error,
    total,
    hasMore: offset < total,
    loadMore,
    refresh,
  };
};

// Hook for single property by listing_id
export const useProperty = (listing_id: string | null) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!listing_id) return;

    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error: supabaseError } = await supabase
          .from('properties')
          .select('*')
          .eq('listing_id', listing_id)
          .single();

        if (supabaseError) throw supabaseError;
        setProperty(data || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch property');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [listing_id]);

  return { property, loading, error };
};

// Hook for filter options
export const useFilterOptions = () => {
  const [cities, setCities] = useState<string[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [citiesResult, typesResult] = await Promise.all([
          supabase.from('properties').select('city').not('city', 'is', null),
          supabase.from('properties').select('property_type').not('property_type', 'is', null),
        ]);

        const uniqueCities = [...new Set(citiesResult.data?.map(r => r.city))].sort();
        const uniqueTypes  = [...new Set(typesResult.data?.map(r => r.property_type))].sort();

        setCities(uniqueCities);
        setPropertyTypes(uniqueTypes);
      } catch (err) {
        console.error('Error loading filter options:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  return { cities, propertyTypes, loading };
};
