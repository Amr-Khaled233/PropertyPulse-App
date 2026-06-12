// Domain types for properties — mirrors the backend contract
// (PropertyPulse shared-types). The mobile app consumes the SAME API as the web
// app, so field names are camelCase DTOs (NOT Supabase snake_case columns).

export type PropertyType = 'apartment' | 'house' | 'villa' | 'townhouse' | 'commercial' | 'land';

export type ListingStatus = 'for_sale' | 'for_rent' | 'sold' | 'off_market';

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface Address {
  line1: string;
  city: string;
  state?: string; // district / town
  country: string;
  postalCode?: string;
}

export interface Property {
  id: string;
  title: string;
  type: PropertyType;
  status: ListingStatus;
  price: number;
  currency: string;
  areaSqm: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt?: number;
  address: Address;
  location?: GeoLocation;
  images: string[];
  description?: string;
  source?: string;
  /** Admin moderation / merchandising fields. */
  featured?: boolean;
  approved?: boolean;
  agentName?: string;
  createdAt: string;
  updatedAt: string;
}

/** Filters bound to the property search UI (query string for GET /properties). */
export interface PropertySearchParams {
  city?: string;
  district?: string;
  type?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  page?: number;
  pageSize?: number;
}

/** Unwrapped page result returned by propertyService.search. */
export interface PropertyPage {
  items: Property[];
  page: number;
  pageSize: number;
  total: number;
}
