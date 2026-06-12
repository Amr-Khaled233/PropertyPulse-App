// User/profile entity mapping: database row <-> domain UserProfile type.

import type { UserProfile, UserRole, PlanTier } from '@propertypulse/shared-types';

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  plan: PlanTier | null;
  avatar_url: string | null;
  created_at: string;
}

export function toUserProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name ?? undefined,
    role: row.role,
    plan: row.plan ?? 'free',
    avatarUrl: row.avatar_url ?? undefined,
    createdAt: row.created_at,
  };
}
