// User and account types.

export type UserRole = 'investor' | 'consultant' | 'admin';

/** Subscription tier. Free is limited (e.g. 3 AI reports/month); paid tiers are unlimited. */
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

/** Monthly AI-report allowance per plan (null = unlimited). */
export const PLAN_REPORT_LIMITS: Record<PlanTier, number | null> = {
  free: 3,
  pro: null,
  enterprise: null,
};

export interface WatchlistItem {
  id: string;
  userId: string;
  propertyId: string;
  notes?: string;
  notifyOnChange: boolean;
  createdAt: string;
}
