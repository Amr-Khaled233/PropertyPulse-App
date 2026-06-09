import { supabase } from '../supabase/supabaseClient';
import { Property, SearchParams, ListingsResponse } from '../../types/listing';

export interface PropertySearchParams {
  query?: string;
  city?: string;
  property_type?: string;
  price_min?: number;
  price_max?: number;
  bedrooms_min?: number;
  bathrooms_min?: number;
  limit?: number;
  offset?: number;
}

export const propertyService = {
  async search(params: PropertySearchParams = {}): Promise<ListingsResponse> {
    try {
      let query = supabase
        .from('properties')
        .select('*', { count: 'exact' });

      if (params.query) {
        query = query.ilike('title', `%${params.query}%`);
      }

      if (params.city) {
        query = query.eq('city', params.city);
      }

      if (params.property_type) {
        query = query.eq('property_type', params.property_type);
      }

      if (params.price_min !== undefined) {
        query = query.gte('price_egp', params.price_min);
      }

      if (params.price_max !== undefined) {
        query = query.lte('price_egp', params.price_max);
      }

      if (params.bedrooms_min !== undefined) {
        query = query.gte('bedrooms', params.bedrooms_min);
      }

      if (params.bathrooms_min !== undefined) {
        query = query.gte('bathrooms', params.bathrooms_min);
      }

      const limit = params.limit || 20;
      const offset = params.offset || 0;

      const { data, error, count } = await query
        .range(offset, offset + limit - 1)
        .order('is_premium', { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        hasMore: (offset + limit) < (count || 0),
      };
    } catch (error) {
      console.error('Failed to search properties:', error);
      return { data: [], total: 0, hasMore: false };
    }
  },

  async getById(id: string): Promise<Property | null> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('listing_id', id)
        .single();

      if (error) throw error;
      return data || null;
    } catch (error) {
      console.error('Failed to fetch property:', error);
      return null;
    }
  },
};