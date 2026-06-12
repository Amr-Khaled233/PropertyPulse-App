// Data collector agent — gathers and normalizes property information before analysis.
// Today it validates the canonical Property shape; it is the seam where external
// listing-API enrichment will plug in later.

import type { Property } from '@propertypulse/shared-types';
import { ApiError } from '../../utils/apiError.js';

export async function collectPropertyData(property: Property): Promise<Property> {
  if (!property.price || property.price <= 0) {
    throw ApiError.badRequest('Property price is required for analysis');
  }
  if (!property.address?.city) {
    throw ApiError.badRequest('Property city is required for market analysis');
  }

  // TODO: enrich from external listing/registry APIs (comparable sales, tax history).
  return property;
}
