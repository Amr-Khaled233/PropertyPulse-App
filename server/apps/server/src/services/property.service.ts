// Property service — business logic around property listings.

import { propertyRepository, type PropertyFilters } from '../repositories/property.repository.js';
import { ApiError } from '../utils/apiError.js';
import type { Property, Paginated } from '@propertypulse/shared-types';

export const propertyService = {
  search(filters: PropertyFilters): Promise<Paginated<Property>> {
    return propertyRepository.search(filters);
  },

  listTowns(city?: string): Promise<string[]> {
    return propertyRepository.listTowns(city);
  },

  async getById(id: string): Promise<Property> {
    const property = await propertyRepository.getById(id);
    if (!property) throw ApiError.notFound('Property not found');
    return property;
  },

  create(input: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> {
    return propertyRepository.create(input);
  },
};
