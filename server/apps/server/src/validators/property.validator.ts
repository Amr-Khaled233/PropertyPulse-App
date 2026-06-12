// Zod schemas for property search/create requests.

import { z } from 'zod';

const propertyType = z.enum(['apartment', 'house', 'villa', 'townhouse', 'commercial', 'land']);
const listingStatus = z.enum(['for_sale', 'for_rent', 'sold', 'off_market']);

export const propertySearchSchema = z.object({
  city: z.string().optional(),
  district: z.string().optional(),
  type: propertyType.optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  bedrooms: z.coerce.number().int().nonnegative().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const createPropertySchema = z.object({
  title: z.string().min(1),
  type: propertyType,
  status: listingStatus.default('for_sale'),
  price: z.number().positive(),
  currency: z.string().default('USD'),
  areaSqm: z.number().positive(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().int().nonnegative(),
  yearBuilt: z.number().int().optional(),
  address: z.object({
    line1: z.string(),
    city: z.string(),
    state: z.string().optional(),
    country: z.string(),
    postalCode: z.string().optional(),
  }),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
  images: z.array(z.string()).default([]),
  description: z.string().optional(),
  source: z.string().optional(),
});

// Partial update used by the admin panel (edit / moderate / feature a listing).
export const updatePropertySchema = z.object({
  title: z.string().min(1).optional(),
  type: propertyType.optional(),
  status: listingStatus.optional(),
  price: z.number().positive().optional(),
  currency: z.string().optional(),
  areaSqm: z.number().positive().optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  yearBuilt: z.number().int().optional(),
  featured: z.boolean().optional(),
  approved: z.boolean().optional(),
  agentName: z.string().optional(),
  description: z.string().optional(),
  address: z
    .object({
      line1: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
});

export type PropertySearchInput = z.infer<typeof propertySearchSchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
