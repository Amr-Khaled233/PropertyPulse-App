import type { UserProfile, UserRole } from '@propertypulse/shared-types';
import { apiClient } from './apiClient';
import { env } from '../../config/env';

export interface AdminStats {
  totalUsers: number;
  totalProperties: number;
  totalReports: number;
  activeToday: number;
  usersChange: number;
  listingsChange: number;
  reportsChange: number;
  revenue: string;
  revenueChange: number;
}

export interface ActivityRow {
  id: string;
  name: string;
  action: string; // i18n key under "admin.activity"
  subtitle: string;
  time: string;
  avatar: string;
}

export interface AdminOverview {
  stats: AdminStats;
  activity: ActivityRow[];
  recentUsers: UserProfile[];
}

const av = (id: string) => `https://i.pravatar.cc/100?img=${id}`;

const demoOverview: AdminOverview = {
  stats: {
    totalUsers: 12842,
    totalProperties: 3120,
    totalReports: 892,
    activeToday: 196,
    usersChange: 10,
    listingsChange: 5.2,
    reportsChange: -2,
    revenue: '$1.2M',
    revenueChange: 8,
  },
  activity: [
    { id: '1', name: 'Marcus Thorne', action: 'report', subtitle: 'Sovereign Estates', time: '2m ago', avatar: av('12') },
    { id: '2', name: 'Elena Rodriguez', action: 'listing', subtitle: 'Azure Heights, Ph. 2', time: '15m ago', avatar: av('5') },
    { id: '3', name: 'David Chen', action: 'profile', subtitle: 'Portfolio Risk Check', time: '1h ago', avatar: av('33') },
    { id: '4', name: 'Sarah Jenkins', action: 'discrepancy', subtitle: 'The Penthouse Suite', time: '3h ago', avatar: av('47') },
  ],
  recentUsers: [],
};

export const adminService = {
  async overview(): Promise<AdminOverview> {
    if (env.hasSupabase) {
      try {
        const { data } = await apiClient.get<{ stats: Partial<AdminStats>; recentUsers: UserProfile[] }>('/admin/overview');
        if (data?.stats) {
          return {
            stats: { ...demoOverview.stats, ...data.stats } as AdminStats,
            recentUsers: data.recentUsers ?? [],
            // Synthesize an activity feed from the most recent sign-ups.
            activity: (data.recentUsers ?? []).slice(0, 4).map((u, i) => ({
              id: u.id,
              name: u.fullName ?? u.email,
              action: 'profile',
              subtitle: u.email,
              time: `#${i + 1}`,
              avatar: av(`${10 + i}`),
            })),
          };
        }
      } catch {
        /* fall through to demo */
      }
    }
    return demoOverview;
  },

  async listUsers(search?: string): Promise<UserProfile[]> {
    if (env.hasSupabase) {
      try {
        const { data } = await apiClient.get<UserProfile[]>('/admin/users', { params: { search } });
        if (Array.isArray(data)) return data;
      } catch {
        /* fall through to demo */
      }
    }
    const q = search?.toLowerCase();
    return demoUsers.filter((u) => !q || `${u.fullName} ${u.email}`.toLowerCase().includes(q));
  },

  async setUserRole(userId: string, role: UserRole): Promise<UserProfile | null> {
    if (env.hasSupabase) {
      const { data } = await apiClient.patch<UserProfile>(`/admin/users/${userId}/role`, { role });
      return data ?? null;
    }
    // Demo mode → mutate the in-memory list so the UI reflects the change.
    const user = demoUsers.find((u) => u.id === userId);
    if (user) user.role = role;
    return user ?? null;
  },
};

const demoUsers: UserProfile[] = [
  { id: 'u1', email: 'sara.m@example.com', fullName: 'Sara Mahmoud', role: 'investor', createdAt: '2025-08-04' },
  { id: 'u2', email: 'khaled@example.com', fullName: 'Khaled Adel', role: 'consultant', createdAt: '2025-08-03' },
  { id: 'u3', email: 'nour@example.com', fullName: 'Nour Hassan', role: 'investor', createdAt: '2025-08-02' },
  { id: 'u4', email: 'omar@example.com', fullName: 'Omar Tarek', role: 'investor', createdAt: '2025-08-01' },
  { id: 'u5', email: 'mona@example.com', fullName: 'Mona Said', role: 'admin', createdAt: '2025-07-30' },
  { id: 'u6', email: 'youssef@example.com', fullName: 'Youssef Ali', role: 'consultant', createdAt: '2025-07-28' },
];