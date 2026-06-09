import { Property, SearchParams, ListingsResponse } from '../types/listing';
import { supabase } from '../services/supabase/supabaseClient';

class ListingsApi {
  // Get all properties with filters
  async getListings(params: SearchParams = {}): Promise<ListingsResponse> {
    try {
      let query = supabase
        .from('properties')
        .select('*', { count: 'exact' });

      // Apply filters
      if (params.search) {
        query = query.ilike('title', `%${params.search}%`);
      }

      if (params.city) {
        query = query.eq('city', params.city);
      }

      if (params.district) {
        query = query.eq('district', params.district);
      }

      if (params.offering_type) {
        if (params.offering_type === 'for_sale') {
          query = query.eq('offering_type', 'Residential for Sale');
        } else if (params.offering_type === 'for_rent') {
          query = query.eq('offering_type', 'Residential for Rent');
        }
      }

      if (params.property_type) {
        query = query.eq('property_type', params.property_type);
      }

      if (params.completion_status) {
        query = query.eq('completion_status', params.completion_status);
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

      // Pagination
      const limit = params.limit || 20;
      const offset = params.offset || 0;
      query = query.range(offset, offset + limit - 1).order('is_premium', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        hasMore: (offset + limit) < (count || 0),
      };
    } catch (error) {
      console.error('Failed to fetch listings:', error);
      return { data: [], total: 0, hasMore: false };
    }
  }

  // Get single property by ID
  async getPropertyById(id: string): Promise<Property | null> {
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
  }

  // Search by city
  async searchByCity(city: string, limit: number = 20): Promise<ListingsResponse> {
    return this.getListings({ city, limit });
  }

  // Get for sale properties
  async getForSale(limit: number = 20): Promise<ListingsResponse> {
    return this.getListings({ offering_type: 'for_sale', limit });
  }

  // Get for rent properties
  async getForRent(limit: number = 20): Promise<ListingsResponse> {
    return this.getListings({ offering_type: 'for_rent', limit });
  }

  // Get featured properties (premium listings)
  async getFeatured(limit: number = 10): Promise<ListingsResponse> {
    try {
      const { data, error, count } = await supabase
        .from('properties')
        .select('*', { count: 'exact' })
        .eq('is_premium', true)
        .order('price_egp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        hasMore: false,
      };
    } catch (error) {
      console.error('Failed to fetch featured properties:', error);
      return { data: [], total: 0, hasMore: false };
    }
  }

  // Get unique cities (for filter chips)
  async getUniqueCities(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('city')
        .not('city', 'is', null);

      if (error) throw error;

      const cities = [...new Set(data?.map(p => p.city).filter(Boolean))].sort() as string[];
      return cities.slice(0, 20);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
      return [];
    }
  }

  // Get unique property types
  async getUniquePropertyTypes(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('property_type')
        .not('property_type', 'is', null);

      if (error) throw error;

      const types = [...new Set(data?.map(p => p.property_type).filter(Boolean))].sort() as string[];
      return types;
    } catch (error) {
      console.error('Failed to fetch property types:', error);
      return [];
    }
  }
}

export const listingsApi = new ListingsApi();