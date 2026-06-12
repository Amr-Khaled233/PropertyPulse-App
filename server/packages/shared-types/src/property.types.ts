// Domain types for properties and listings (shared across web, mobile, server).

export type PropertyType = 'apartment' | 'house' | 'villa' | 'townhouse' | 'commercial' | 'land';

export type ListingStatus = 'for_sale' | 'for_rent' | 'sold' | 'off_market';

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface Address {
  line1: string;
  city: string;
  state?: string;
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
