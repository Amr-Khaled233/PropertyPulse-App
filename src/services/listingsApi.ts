import { supabase } from '../lib/supabase';
import { Property, SearchParams, ListingsResponse } from '../types/listing';

const BASE_SELECT = `
  listing_id, title, property_type, offering_type, completion_status,
  price_egp, city, town, district, lat, lon,
  bedrooms, bathrooms, area_value, furnished, amenities,
  is_verified, is_premium, is_featured, images_count,
  detail_url, agent_name, contact_phone, contact_whatsapp,
  payment_method, description, listed_date, location_full
`;

class ListingsApi {

  async getListings(params: SearchParams = {}): Promise<ListingsResponse> {
    let query = supabase.from('properties').select(BASE_SELECT, { count: 'exact' });

    if (params.offering_type === 'for_sale') {
      query = query.eq('offering_type', 'Residential for Sale');
    } else if (params.offering_type === 'for_rent') {
      query = query.eq('offering_type', 'Residential for Rent');
    }

    if (params.city)              query = query.eq('city', params.city);
    if (params.district)          query = query.eq('district', params.district);
    if (params.property_type)     query = query.eq('property_type', params.property_type);
    if (params.completion_status) query = query.eq('completion_status', params.completion_status);
    if (params.price_min)         query = query.gte('price_egp', params.price_min);
    if (params.price_max)         query = query.lte('price_egp', params.price_max);
    if (params.bedrooms_min)      query = query.gte('bedrooms', params.bedrooms_min);
    if (params.bathrooms_min)     query = query.gte('bathrooms', params.bathrooms_min);
    if (params.search)            query = query.ilike('title', `%${params.search}%`);

    const limit  = params.limit  || 20;
    const offset = params.offset || 0;

    const { data, error, count } = await query
      .order('is_premium', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return {
      data: data || [],
      total: count || 0,
      hasMore: offset + limit < (count || 0),
    };
  }

  async getPropertyById(listing_id: string): Promise<Property | null> {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('listing_id', listing_id)
      .single();

    if (error) throw new Error(error.message);
    return data || null;
  }

  async getFeatured(limit = 10): Promise<ListingsResponse> {
    return this.getListings({ offering_type: 'for_sale', limit });
  }

  async getForSale(limit = 20):  Promise<ListingsResponse> {
    return this.getListings({ offering_type: 'for_sale', limit });
  }

  async getForRent(limit = 20):  Promise<ListingsResponse> {
    return this.getListings({ offering_type: 'for_rent', limit });
  }

  async searchByCity(city: string, limit = 20): Promise<ListingsResponse> {
    return this.getListings({ city, limit });
  }

  async getByPropertyType(type: string, limit = 20): Promise<ListingsResponse> {
    return this.getListings({ property_type: type, limit });
  }

  async getByPriceRange(min: number, max: number, limit = 20): Promise<ListingsResponse> {
    return this.getListings({ price_min: min, price_max: max, limit });
  }

  async getUniqueCities(): Promise<string[]> {
    const { data } = await supabase.from('properties').select('city').not('city', 'is', null);
    return [...new Set(data?.map(r => r.city))].sort() as string[];
  }

  async getUniquePropertyTypes(): Promise<string[]> {
    const { data } = await supabase.from('properties').select('property_type').not('property_type', 'is', null);
    return [...new Set(data?.map(r => r.property_type))].sort() as string[];
  }
}

export const listingsApi = new ListingsApi();