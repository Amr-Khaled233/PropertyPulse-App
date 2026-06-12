// Properties — consumes the backend API (NOT Supabase directly).
//   GET /properties?city&district&type&minPrice&maxPrice&bedrooms&page&pageSize
//   GET /properties/towns?city=
//   GET /properties/:id

import { apiClient } from './apiClient';
import type { Property, PropertySearchParams, PropertyPage } from '../../types/listing';

function cleanParams(params: PropertySearchParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  });
  return out;
}

export const propertyService = {
  async search(params: PropertySearchParams = {}): Promise<PropertyPage> {
    const { data, meta } = await apiClient.get<Property[]>('/properties', cleanParams(params));
    return {
      items: data,
      page: meta?.page ?? params.page ?? 1,
      pageSize: meta?.pageSize ?? data.length,
      total: meta?.total ?? data.length,
    };
  },

  async getById(id: string): Promise<Property> {
    const { data } = await apiClient.get<Property>(`/properties/${id}`);
    return data;
  },

  /** Distinct towns/areas (for the district filter), optionally scoped to a city. */
  async getTowns(city?: string): Promise<string[]> {
    const { data } = await apiClient.get<string[]>('/properties/towns', city ? { city } : undefined);
    return data;
  },
};
