export type UserRole = 'investor' | 'agent' | 'broker' | 'admin' | 'consultant';

export type Permission = 'admin:dashboard' | 'admin:users' | 'admin:settings' | 'view:properties' | 'edit:profile';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export const ROLE_ORDER: UserRole[] = ['admin', 'consultant', 'broker', 'agent', 'investor'];

const rolePermissions: Record<UserRole, Permission[]> = {
  admin: ['admin:dashboard', 'admin:users', 'admin:settings', 'view:properties', 'edit:profile'],
  consultant: ['view:properties', 'edit:profile'],
  agent: ['view:properties', 'edit:profile'],
  broker: ['view:properties', 'edit:profile'],
  investor: ['view:properties', 'edit:profile'],
};

export function can(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}
