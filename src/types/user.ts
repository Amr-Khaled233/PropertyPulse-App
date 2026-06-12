// User and account types — mirrors the backend contract (shared-types).

export type UserRole = 'investor' | 'consultant' | 'admin';

/** Subscription tier. Free is limited (3 AI reports/month); paid tiers unlimited. */
export type PlanTier = 'free' | 'pro' | 'enterprise';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  role: UserRole;
  /** Subscription tier; defaults to 'free' when absent. */
  plan?: PlanTier;
  avatarUrl?: string;
  createdAt: string;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  propertyId: string;
  notes?: string;
  notifyOnChange: boolean;
  createdAt: string;
}

/** Monthly AI-report allowance per plan (null = unlimited). */
export const PLAN_REPORT_LIMITS: Record<PlanTier, number | null> = {
  free: 3,
  pro: null,
  enterprise: null,
};

export const ROLE_ORDER: UserRole[] = ['admin', 'consultant', 'investor'];

export type Permission = 'admin:dashboard' | 'admin:users' | 'admin:settings' | 'view:properties' | 'edit:profile';

const rolePermissions: Record<UserRole, Permission[]> = {
  admin: ['admin:dashboard', 'admin:users', 'admin:settings', 'view:properties', 'edit:profile'],
  consultant: ['view:properties', 'edit:profile'],
  investor: ['view:properties', 'edit:profile'],
};

export function can(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}
