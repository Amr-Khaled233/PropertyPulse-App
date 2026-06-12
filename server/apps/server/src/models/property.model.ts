// Property entity mapping: database row (snake_case) <-> domain Property type.

import type { Property, PropertyType, ListingStatus } from '@propertypulse/shared-types';

export interface PropertyRow {
  id: string;
  title: string;
  type: PropertyType;
  status: ListingStatus;
  price: number | string;
  currency: string;
  area_sqm: number | string;
  bedrooms: number;
  bathrooms: number;
  year_built: number | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  lat: number | null;
  lng: number | null;
  images: string[] | null;
  description: string | null;
  source: string | null;
  featured: boolean | null;
  approved: boolean | null;
  agent_name: string | null;
  neighborhood_id: string | null;
  created_at: string;
  updated_at: string;
}

export function toProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    status: row.status,
    price: Number(row.price),
    currency: row.currency,
    areaSqm: Number(row.area_sqm),
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    yearBuilt: row.year_built ?? undefined,
    address: {
      line1: row.address_line1 ?? '',
      city: row.city ?? '',
      state: row.state ?? undefined,
      country: row.country ?? '',
      postalCode: row.postal_code ?? undefined,
    },
    location: row.lat != null && row.lng != null ? { lat: row.lat, lng: row.lng } : undefined,
    images: row.images ?? [],
    description: row.description ?? undefined,
    source: row.source ?? undefined,
    featured: row.featured ?? false,
    approved: row.approved ?? true,
    agentName: row.agent_name ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toPropertyInsert(p: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Record<string, unknown> {
  return {
    title: p.title,
    type: p.type,
    status: p.status,
    price: p.price,
    currency: p.currency,
    area_sqm: p.areaSqm,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    year_built: p.yearBuilt ?? null,
    address_line1: p.address.line1,
    city: p.address.city,
    state: p.address.state ?? null,
    country: p.address.country,
    postal_code: p.address.postalCode ?? null,
    lat: p.location?.lat ?? null,
    lng: p.location?.lng ?? null,
    images: p.images,
    description: p.description ?? null,
    source: p.source ?? null,
    featured: p.featured ?? false,
    approved: p.approved ?? true,
    agent_name: p.agentName ?? null,
  };
}

/** Map a partial domain patch to a snake_case row update (admin edits). */
export function toPropertyUpdate(p: Partial<Property>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (p.title !== undefined) row.title = p.title;
  if (p.type !== undefined) row.type = p.type;
  if (p.status !== undefined) row.status = p.status;
  if (p.price !== undefined) row.price = p.price;
  if (p.currency !== undefined) row.currency = p.currency;
  if (p.areaSqm !== undefined) row.area_sqm = p.areaSqm;
  if (p.bedrooms !== undefined) row.bedrooms = p.bedrooms;
  if (p.bathrooms !== undefined) row.bathrooms = p.bathrooms;
  if (p.yearBuilt !== undefined) row.year_built = p.yearBuilt;
  if (p.featured !== undefined) row.featured = p.featured;
  if (p.approved !== undefined) row.approved = p.approved;
  if (p.agentName !== undefined) row.agent_name = p.agentName;
  if (p.description !== undefined) row.description = p.description;
  if (p.address !== undefined) {
    if (p.address.line1 !== undefined) row.address_line1 = p.address.line1;
    if (p.address.city !== undefined) row.city = p.address.city;
    if (p.address.state !== undefined) row.state = p.address.state;
    if (p.address.country !== undefined) row.country = p.address.country;
  }
  row.updated_at = new Date().toISOString();
  return row;
}
