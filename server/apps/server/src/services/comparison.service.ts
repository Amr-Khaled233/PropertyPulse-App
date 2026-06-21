// Saved comparisons service.

import { comparisonRepository, type SavedComparison } from '../repositories/comparison.repository.js';

export const comparisonService = {
  list(userId: string): Promise<SavedComparison[]> {
    return comparisonRepository.list(userId);
  },
  save(userId: string, propertyIds: string[], result: unknown): Promise<SavedComparison> {
    return comparisonRepository.create(userId, propertyIds, result);
  },
  remove(userId: string, id: string): Promise<void> {
    return comparisonRepository.remove(userId, id);
  },
};
