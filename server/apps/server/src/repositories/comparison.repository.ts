// Saved comparisons repository — server-side persistence of a user's AI
// comparisons (the full result snapshot) in the `comparisons` table.

import { supabase } from '../config/supabase.js';
import { ApiError } from '../utils/apiError.js';

interface ComparisonRow {
  id: string;
  user_id: string;
  property_ids: string[];
  result: unknown;
  created_at: string;
}

export interface SavedComparison {
  id: string;
  propertyIds: string[];
  result: unknown;
  createdAt: string;
}

function toModel(r: ComparisonRow): SavedComparison {
  return { id: r.id, propertyIds: r.property_ids ?? [], result: r.result, createdAt: r.created_at };
}

export const comparisonRepository = {
  async list(userId: string): Promise<SavedComparison[]> {
    const { data, error } = await supabase
      .from('comparisons')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new ApiError(500, 'COMPARISONS_FETCH_FAILED', error.message);
    return (data as ComparisonRow[]).map(toModel);
  },

  async create(userId: string, propertyIds: string[], result: unknown): Promise<SavedComparison> {
    const { data, error } = await supabase
      .from('comparisons')
      .insert({ user_id: userId, property_ids: propertyIds, result })
      .select('*')
      .single();
    if (error) throw new ApiError(500, 'COMPARISON_SAVE_FAILED', error.message);
    return toModel(data as ComparisonRow);
  },

  async remove(userId: string, id: string): Promise<void> {
    const { error } = await supabase.from('comparisons').delete().eq('id', id).eq('user_id', userId);
    if (error) throw new ApiError(500, 'COMPARISON_DELETE_FAILED', error.message);
  },
};
