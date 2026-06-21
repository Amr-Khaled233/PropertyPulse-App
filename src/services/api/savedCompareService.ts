// Saved comparisons — server-side (syncs across devices). Replaces the old
// on-device AsyncStorage cache. Stores the full comparison result snapshot.
//   GET    /comparisons        → list
//   POST   /comparisons        → { propertyIds, result }
//   DELETE /comparisons/:id

import { apiClient } from './apiClient';
import type { ComparisonResult } from './analysisService';

export interface SavedCompare {
  id: string;
  propertyIds: string[];
  result: ComparisonResult;
  createdAt: string;
}

export const savedCompareService = {
  async list(): Promise<SavedCompare[]> {
    const { data } = await apiClient.get<SavedCompare[]>('/comparisons');
    return data;
  },

  async getById(id: string): Promise<SavedCompare | undefined> {
    return (await this.list()).find((x) => x.id === id);
  },

  async save(result: ComparisonResult): Promise<void> {
    const propertyIds = result.candidates.map((c) => c.property.id);
    await apiClient.post('/comparisons', { propertyIds, result });
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/comparisons/${id}`);
  },
};
